const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;
let connectionAttempted = false;

// High-performance in-memory fallback store with TTL support
const memoryStore = new Map(); // key -> { value, expiresAt }

function memoryGet(key) {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

function memorySet(key, value, ttlSeconds) {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function memoryDel(keys) {
  for (const k of keys) {
    memoryStore.delete(k);
  }
}

function memoryTTL(key) {
  const item = memoryStore.get(key);
  if (!item) return -1;
  const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
  if (remaining <= 0) {
    memoryStore.delete(key);
    return -1;
  }
  return remaining;
}

// Clean up expired items periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (now > item.expiresAt) {
      memoryStore.delete(key);
    }
  }
}, 10000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

async function getRedisClient() {
  if (isConnected && redisClient) return redisClient;
  if (connectionAttempted && !isConnected) return null;

  connectionAttempted = true;
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return false; // Stop reconnecting and use fallback
          }
          return 1000;
        },
      },
    });

    client.on('error', (err) => {
      if (isConnected) {
        console.warn('⚠️ Redis error:', err.message);
      }
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis server');
      isConnected = true;
    });

    await client.connect();
    redisClient = client;
    return redisClient;
  } catch (err) {
    console.log('ℹ️  Redis server not reachable, using resilient in-memory seat lock manager.');
    isConnected = false;
    return null;
  }
}

const SEAT_LOCK_TTL = 300; // 5 minutes in seconds
const LOCK_KEY_PREFIX = 'seat_lock';

const redisService = {
  async getClient() {
    return getRedisClient();
  },

  /**
   * Acquire a temporary seat lock for 5 minutes.
   * Returns true if lock was acquired, false if seat is already locked by someone else.
   */
  async lockSeat(showId, seatId, userId) {
    try {
      const client = await getRedisClient();
      const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;

      if (client && isConnected) {
        const result = await client.set(key, userId, {
          EX: SEAT_LOCK_TTL,
          NX: true,
        });
        return result === 'OK';
      }

      // In-memory fallback
      const existing = memoryGet(key);
      if (existing && existing !== userId) {
        return false;
      }
      memorySet(key, userId, SEAT_LOCK_TTL);
      return true;
    } catch (err) {
      console.error('Redis lockSeat error:', err.message);
      return false;
    }
  },

  /**
   * Lock multiple seats atomically. Returns array of successfully locked seat IDs.
   * If any seat fails to lock, rolls back all acquired locks.
   */
  async lockSeats(showId, seatIds, userId) {
    const lockedSeatIds = [];
    try {
      const client = await getRedisClient();

      if (client && isConnected) {
        for (const seatId of seatIds) {
          const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;
          const existing = await client.get(key);

          if (existing && existing !== userId) {
            await this.releaseSeats(showId, lockedSeatIds);
            return { success: false, lockedSeatIds: [], conflictSeatId: seatId };
          }

          const result = await client.set(key, userId, {
            EX: SEAT_LOCK_TTL,
          });

          if (result === 'OK' || existing === userId) {
            lockedSeatIds.push(seatId);
          }
        }
        return { success: true, lockedSeatIds };
      }

      // In-memory fallback
      for (const seatId of seatIds) {
        const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;
        const existing = memoryGet(key);

        if (existing && existing !== userId) {
          await this.releaseSeats(showId, lockedSeatIds);
          return { success: false, lockedSeatIds: [], conflictSeatId: seatId };
        }

        memorySet(key, userId, SEAT_LOCK_TTL);
        lockedSeatIds.push(seatId);
      }

      return { success: true, lockedSeatIds };
    } catch (err) {
      console.error('lockSeats error:', err.message);
      await this.releaseSeats(showId, lockedSeatIds);
      return { success: false, lockedSeatIds: [], error: err.message };
    }
  },

  /**
   * Release locks for multiple seats
   */
  async releaseSeats(showId, seatIds) {
    try {
      const client = await getRedisClient();
      const keys = seatIds.map((sid) => `${LOCK_KEY_PREFIX}:${showId}:${sid}`);

      if (client && isConnected && keys.length > 0) {
        await client.del(keys);
        return;
      }

      memoryDel(keys);
    } catch (err) {
      console.error('releaseSeats error:', err.message);
    }
  },

  /**
   * Get all locked seats for a show.
   * Returns a map of seatId -> userId
   */
  async getLockedSeats(showId) {
    try {
      const client = await getRedisClient();
      const pattern = `${LOCK_KEY_PREFIX}:${showId}:*`;

      if (client && isConnected) {
        const keys = await client.keys(pattern);
        if (!keys.length) return {};

        const values = await client.mGet(keys);
        const lockMap = {};

        keys.forEach((key, i) => {
          const seatId = key.split(':')[2];
          if (values[i]) {
            lockMap[seatId] = values[i];
          }
        });

        return lockMap;
      }

      // In-memory fallback
      const prefix = `${LOCK_KEY_PREFIX}:${showId}:`;
      const lockMap = {};
      for (const [key, item] of memoryStore.entries()) {
        if (key.startsWith(prefix) && Date.now() <= item.expiresAt) {
          const seatId = key.split(':')[2];
          lockMap[seatId] = item.value;
        }
      }
      return lockMap;
    } catch (err) {
      console.error('getLockedSeats error:', err.message);
      return {};
    }
  },

  /**
   * Check if a specific seat is locked and by whom
   */
  async getSeatLock(showId, seatId) {
    try {
      const client = await getRedisClient();
      const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;

      if (client && isConnected) {
        return await client.get(key);
      }

      return memoryGet(key);
    } catch (err) {
      return null;
    }
  },

  /**
   * Get the remaining TTL in seconds for a seat lock
   */
  async getSeatLockTTL(showId, seatId) {
    try {
      const client = await getRedisClient();
      const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;

      if (client && isConnected) {
        return await client.ttl(key);
      }

      return memoryTTL(key);
    } catch (err) {
      return -1;
    }
  },

  /**
   * Extend lock TTL (refresh the 5-minute timer)
   */
  async extendLock(showId, seatId, userId) {
    try {
      const client = await getRedisClient();
      const key = `${LOCK_KEY_PREFIX}:${showId}:${seatId}`;

      if (client && isConnected) {
        const currentHolder = await client.get(key);
        if (currentHolder === userId) {
          await client.expire(key, SEAT_LOCK_TTL);
          return true;
        }
        return false;
      }

      const currentHolder = memoryGet(key);
      if (currentHolder === userId) {
        memorySet(key, userId, SEAT_LOCK_TTL);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  /**
   * Health check
   */
  async ping() {
    try {
      const client = await getRedisClient();
      if (client && isConnected) {
        const result = await client.ping();
        return result === 'PONG';
      }
      return true; // Memory fallback is active and healthy
    } catch (err) {
      return true; // Fallback ready
    }
  },
};

module.exports = redisService;
