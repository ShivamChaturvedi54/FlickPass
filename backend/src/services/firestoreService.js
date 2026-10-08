const { db } = require('./firebase');
const { getDefaultData } = require('../data/seedData');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

let isSeeding = false;

const firestoreService = {
  /**
   * Auto-seed Firestore on startup if empty
   */
  async seedIfEmpty() {
    if (isSeeding) return;
    try {
      const moviesSnap = await db.collection('movies').limit(1).get();
      if (!moviesSnap.empty) {
        return; // Already populated
      }

      isSeeding = true;
      console.log('🌱 [Firebase] Seeding initial FlickPass catalog into Firestore...');
      const seedData = getDefaultData();

      // 1. Seed Theaters
      for (const theater of seedData.theaters) {
        await db.collection('theaters').doc(theater.id).set(theater);
      }

      // 2. Seed Movies
      for (const movie of seedData.movies) {
        await db.collection('movies').doc(movie.id).set(movie);
      }

      // 3. Seed Users
      for (const user of seedData.users) {
        await db.collection('users').doc(user.id).set(user);
      }

      // 4. Seed Shows
      for (const show of seedData.shows) {
        await db.collection('shows').doc(show.id).set(show);
      }

      // 5. Seed Seats in batches
      const BATCH_SIZE = 400;
      for (let i = 0; i < seedData.seats.length; i += BATCH_SIZE) {
        const chunk = seedData.seats.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const seat of chunk) {
          const ref = db.collection('seats').doc(seat.id);
          batch.set(ref, seat);
        }
        await batch.commit();
      }

      console.log(`✅ [Firebase] Seeded ${seedData.movies.length} movies, ${seedData.theaters.length} theaters, ${seedData.shows.length} shows, and ${seedData.seats.length} seats into Firestore!`);
    } catch (err) {
      console.error('⚠️ [Firebase] Seeding error:', err.message);
    } finally {
      isSeeding = false;
    }
  },

  /**
   * User operations
   */
  async findUserByEmail(email) {
    const snap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data();
  },

  async findUserById(id) {
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async createUser({ email, name, passwordHash }) {
    const id = `user-${uuidv4()}`;
    const user = {
      id,
      email: email.toLowerCase().trim(),
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await db.collection('users').doc(id).set(user);
    return user;
  },

  /**
   * Movies operations
   */
  async getMovies({ search, status, page = 1, limit = 20 }) {
    await this.seedIfEmpty();

    let query = db.collection('movies');
    if (status) {
      query = query.where('status', '==', status);
    }

    const snap = await query.get();
    let movies = snap.docs.map((d) => d.data());

    // Search filter (client/memory search for case-insensitivity)
    if (search) {
      const q = search.toLowerCase();
      movies = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
      );
    }

    // Sort by createdAt desc
    movies.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = movies.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = movies.slice(skip, skip + parseInt(limit));

    // Get show counts for paginated movies
    const enriched = await Promise.all(
      paginated.map(async (m) => {
        const showsSnap = await db.collection('shows').where('movieId', '==', m.id).get();
        return {
          ...m,
          _count: { shows: showsSnap.size },
        };
      })
    );

    return {
      movies: enriched,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  },

  async getMovieById(id) {
    await this.seedIfEmpty();
    const doc = await db.collection('movies').doc(id).get();
    if (!doc.exists) return null;

    const movie = doc.data();

    // Fetch shows for this movie
    const showsSnap = await db.collection('shows').where('movieId', '==', id).get();
    const now = new Date();

    const shows = showsSnap.docs
      .map((d) => d.data())
      .filter((s) => s.isActive && new Date(s.startTime) >= now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Group shows by theater
    const showsByTheater = {};
    for (const show of shows) {
      const theaterId = show.theaterId;
      if (!showsByTheater[theaterId]) {
        showsByTheater[theaterId] = {
          theater: show.theater,
          shows: [],
        };
      }
      showsByTheater[theaterId].shows.push(show);
    }

    return {
      ...movie,
      shows,
      showsByTheater: Object.values(showsByTheater),
    };
  },

  /**
   * Shows operations
   */
  async getShowById(id) {
    const doc = await db.collection('shows').doc(id).get();
    if (!doc.exists) return null;
    return doc.data();
  },

  async getShowSeats(showId, userId) {
    await this.seedIfEmpty();
    const showDoc = await db.collection('shows').doc(showId).get();
    if (!showDoc.exists) return null;
    const show = showDoc.data();

    // Fetch seats for this show
    const seatsSnap = await db.collection('seats').where('showId', '==', showId).get();
    let seats = seatsSnap.docs.map((d) => d.data());

    // Sort by rowLabel asc, seatNumber asc
    seats.sort((a, b) => {
      if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
      return a.seatNumber - b.seatNumber;
    });

    // Fetch active seat locks for this show
    const locksSnap = await db.collection('seat_locks').where('showId', '==', showId).get();
    const now = Date.now();
    const activeLocks = {};

    for (const lockDoc of locksSnap.docs) {
      const lock = lockDoc.data();
      if (lock.expiresAt > now) {
        activeLocks[lock.seatId] = lock.userId;
      } else {
        // Clean up expired lock asynchronously
        db.collection('seat_locks').doc(lockDoc.id).delete().catch(() => {});
      }
    }

    // Determine lock expiration for this user if they hold locks
    let lockExpiresAt = null;
    if (userId) {
      const userLocks = locksSnap.docs
        .map((d) => d.data())
        .filter((l) => l.userId === userId && l.expiresAt > now);
      if (userLocks.length > 0) {
        lockExpiresAt = new Date(userLocks[0].expiresAt).toISOString();
      }
    }

    // Enrich seats with real-time status
    const enrichedSeats = seats.map((seat) => {
      let status = 'AVAILABLE';
      if (seat.isReserved) {
        status = 'BOOKED';
      } else if (activeLocks[seat.id]) {
        const lockOwner = activeLocks[seat.id];
        if (userId && lockOwner === userId) {
          status = 'SELECTED';
        } else {
          status = 'LOCKED_TEMPORARY';
        }
      }

      return {
        ...seat,
        status,
        lockedBy: activeLocks[seat.id] || null,
      };
    });

    // Group by row
    const seatsByRow = {};
    for (const seat of enrichedSeats) {
      if (!seatsByRow[seat.rowLabel]) {
        seatsByRow[seat.rowLabel] = [];
      }
      seatsByRow[seat.rowLabel].push(seat);
    }

    const stats = {
      total: enrichedSeats.length,
      available: enrichedSeats.filter((s) => s.status === 'AVAILABLE').length,
      booked: enrichedSeats.filter((s) => s.status === 'BOOKED').length,
      lockedTemporary: enrichedSeats.filter((s) => s.status === 'LOCKED_TEMPORARY').length,
      selected: enrichedSeats.filter((s) => s.status === 'SELECTED').length,
    };

    return {
      show,
      seatsByRow,
      seats: enrichedSeats,
      stats,
      lockExpiresAt,
    };
  },

  /**
   * Temporary seat locking in Firestore with 5-minute lease expiration
   */
  async lockSeats(showId, seatIds, userId) {
    const show = await this.getShowById(showId);
    if (!show) {
      return { success: false, message: 'Show not found' };
    }

    const now = Date.now();
    const expiresAt = now + 300 * 1000; // 5 minutes TTL

    // Verify seats in Firestore
    const seatsToLock = [];
    for (const seatId of seatIds) {
      const seatDoc = await db.collection('seats').doc(seatId).get();
      if (!seatDoc.exists || seatDoc.data().showId !== showId || seatDoc.data().isReserved) {
        return {
          success: false,
          conflictSeatId: seatId,
          message: 'One or more seats are already permanently reserved or invalid',
        };
      }
      seatsToLock.push(seatDoc.data());

      // Check current lock in seat_locks
      const lockDocId = `${showId}_${seatId}`;
      const lockDoc = await db.collection('seat_locks').doc(lockDocId).get();
      if (lockDoc.exists) {
        const lock = lockDoc.data();
        if (lock.expiresAt > now && lock.userId !== userId) {
          return {
            success: false,
            conflictSeatId: seatId,
            message: 'One or more seats are temporarily held by another user',
          };
        }
      }
    }

    // Atomically set locks for all seats
    const batch = db.batch();
    for (const seat of seatsToLock) {
      const lockDocId = `${showId}_${seat.id}`;
      const lockRef = db.collection('seat_locks').doc(lockDocId);
      batch.set(lockRef, {
        id: lockDocId,
        showId,
        seatId: seat.id,
        userId,
        lockedAt: now,
        expiresAt,
      });
    }
    await batch.commit();

    // Calculate pricing
    const pricing = seatsToLock.reduce(
      (acc, seat) => {
        if (seat.category === 'VIP') {
          acc.vipCount++;
          acc.total += show.priceVip;
        } else {
          acc.standardCount++;
          acc.total += show.priceStandard;
        }
        return acc;
      },
      { total: 0, standardCount: 0, vipCount: 0 }
    );

    const bookingFee = parseFloat((pricing.total * 0.02).toFixed(2));
    const grandTotal = parseFloat((pricing.total + bookingFee).toFixed(2));

    return {
      success: true,
      data: {
        showId,
        lockedSeats: seatsToLock,
        pricing: {
          standardSeats: pricing.standardCount,
          vipSeats: pricing.vipCount,
          standardPrice: show.priceStandard,
          vipPrice: show.priceVip,
          subtotal: pricing.total,
          bookingFee,
          total: grandTotal,
        },
        lockExpiresAt: new Date(expiresAt).toISOString(),
        ttlSeconds: 300,
      },
    };
  },

  /**
   * Release seat locks in Firestore
   */
  async releaseSeats(showId, seatIds) {
    const batch = db.batch();
    for (const seatId of seatIds) {
      const lockDocId = `${showId}_${seatId}`;
      batch.delete(db.collection('seat_locks').doc(lockDocId));
    }
    await batch.commit();
    return { success: true };
  },

  /**
   * Confirm booking with atomic transaction in Firestore
   */
  async confirmBooking({ showId, seatIds, userId, paymentMethod = 'MOCK_PAYMENT' }) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const showDoc = await db.collection('shows').doc(showId).get();
    if (!showDoc.exists) {
      throw new Error('SHOW_NOT_FOUND');
    }
    const show = showDoc.data();

    // Run atomic Firestore transaction
    return await db.runTransaction(async (transaction) => {
      const seats = [];

      // 1. Verify seats in transaction
      for (const seatId of seatIds) {
        const seatRef = db.collection('seats').doc(seatId);
        const seatDoc = await transaction.get(seatRef);

        if (!seatDoc.exists || seatDoc.data().isReserved) {
          throw new Error('SEATS_ALREADY_RESERVED');
        }
        seats.push(seatDoc.data());
      }

      // 2. Calculate totals
      const total = seats.reduce((sum, seat) => {
        return sum + (seat.category === 'VIP' ? show.priceVip : show.priceStandard);
      }, 0);
      const bookingFee = parseFloat((total * 0.02).toFixed(2));
      const grandTotal = parseFloat((total + bookingFee).toFixed(2));

      // 3. Generate QR Payload and Hash
      const bookingId = `booking-${uuidv4()}`;
      const qrPayload = {
        bookingId,
        userId,
        showId,
        seatIds,
        totalAmount: grandTotal,
        timestamp: Date.now(),
      };
      const qrCodeHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(qrPayload))
        .digest('hex');

      const now = new Date().toISOString();

      const newBooking = {
        id: bookingId,
        userId,
        showId,
        totalAmount: grandTotal,
        status: 'CONFIRMED',
        paymentMethod,
        qrCodeHash,
        qrPayload,
        seats,
        show: {
          id: show.id,
          startTime: show.startTime,
          screenNumber: show.screenNumber,
          movie: show.movie,
          theater: show.theater,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        createdAt: now,
      };

      // 4. Create booking document in Firestore
      const bookingRef = db.collection('bookings').doc(bookingId);
      transaction.set(bookingRef, newBooking);

      // 5. Permanently mark seats as reserved
      for (const seat of seats) {
        const seatRef = db.collection('seats').doc(seat.id);
        transaction.update(seatRef, { isReserved: true });
      }

      // 6. Delete seat locks
      for (const seat of seats) {
        const lockRef = db.collection('seat_locks').doc(`${showId}_${seat.id}`);
        transaction.delete(lockRef);
      }

      return {
        booking: newBooking,
        seats,
        show,
        grandTotal,
      };
    });
  },

  /**
   * Get booking by ID
   */
  async getBookingById(id) {
    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) return null;
    return doc.data();
  },

  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId) {
    const snap = await db.collection('bookings').where('userId', '==', userId).get();
    const bookings = snap.docs.map((d) => d.data());
    // Sort descending by createdAt
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return bookings;
  },
};

module.exports = firestoreService;
