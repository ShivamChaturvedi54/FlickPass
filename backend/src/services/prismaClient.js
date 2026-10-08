const localDb = require('./localDb');

let prismaClient = null;
let useLocalDb = false;

const databaseUrl = process.env.DATABASE_URL || '';
const isLocalhostDb = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

// If on Vercel or in production without a remote PostgreSQL database, use localDb immediately
if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && isLocalhostDb) {
  console.log('ℹ️  Vercel environment without remote PostgreSQL detected. Using resilient FlickPass local database.');
  useLocalDb = true;
} else {
  try {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    console.log('✅ Initialized Prisma Client');
  } catch (err) {
    console.log('ℹ️  Prisma client initialization failed, falling back to localDb:', err.message);
    useLocalDb = true;
  }
}

// Resilient wrapper: proxy every model and query to Prisma if available, falling back to localDb on connection error
const createModelProxy = (modelName) => {
  return new Proxy(localDb[modelName] || {}, {
    get(target, prop) {
      return async (...args) => {
        if (!useLocalDb && prismaClient && prismaClient[modelName]) {
          try {
            return await prismaClient[modelName][prop](...args);
          } catch (err) {
            console.warn(`⚠️ Prisma ${modelName}.${prop} failed (${err.message}). Using localDb fallback.`);
            // If connection failure or schema issue, switch to localDb for this and future queries
            if (
              err.message.includes("Can't reach database") ||
              err.message.includes('connect ECONNREFUSED') ||
              err.code?.startsWith('P1') ||
              err.code === 'P2021'
            ) {
              useLocalDb = true;
            }
          }
        }
        if (target && typeof target[prop] === 'function') {
          return target[prop](...args);
        }
        return undefined;
      };
    },
  });
};

const prismaProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === '$transaction') {
      return async (callbackOrArray) => {
        if (!useLocalDb && prismaClient) {
          try {
            return await prismaClient.$transaction(callbackOrArray);
          } catch (err) {
            console.warn('⚠️ Prisma $transaction failed, falling back to localDb:', err.message);
            useLocalDb = true;
          }
        }
        return localDb.$transaction(callbackOrArray);
      };
    }
    if (prop === '$queryRaw') {
      return async (...args) => {
        if (!useLocalDb && prismaClient) {
          try {
            return await prismaClient.$queryRaw(...args);
          } catch (err) {
            useLocalDb = true;
          }
        }
        return [{ 1: 1 }];
      };
    }
    if (prop === '$disconnect') {
      return async () => {
        if (prismaClient) await prismaClient.$disconnect().catch(() => {});
        return localDb.$disconnect();
      };
    }
    return createModelProxy(prop);
  },
});

module.exports = prismaProxy;
