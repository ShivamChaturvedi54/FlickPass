const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const prisma = require('../services/prismaClient');
const redisService = require('../services/redisService');

const bookingsController = {
  /**
   * POST /api/bookings/lock-seats
   * Atomically lock 1-6 seats in Redis for 5 minutes
   * Body: { showId, seatIds: [], userId }
   */
  async lockSeats(req, res) {
    try {
      const { showId, seatIds, userId } = req.body;

      if (!showId || !seatIds || !userId) {
        return res.status(400).json({
          success: false,
          message: 'showId, seatIds, and userId are required',
        });
      }

      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'seatIds must be a non-empty array',
        });
      }

      if (seatIds.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 6 seats can be selected at once',
        });
      }

      // Verify show exists and seats belong to it
      const seats = await prisma.seat.findMany({
        where: {
          id: { in: seatIds },
          showId,
          isReserved: false, // Must not be permanently reserved
        },
      });

      if (seats.length !== seatIds.length) {
        return res.status(409).json({
          success: false,
          message: 'One or more seats are already permanently reserved or do not exist',
        });
      }

      // Attempt atomic lock in Redis
      const lockResult = await redisService.lockSeats(showId, seatIds, userId);

      if (!lockResult.success) {
        return res.status(409).json({
          success: false,
          message: 'One or more seats are already temporarily locked by another user',
          conflictSeatId: lockResult.conflictSeatId,
        });
      }

      // Calculate price
      const show = await prisma.show.findUnique({
        where: { id: showId },
        select: { priceStandard: true, priceVip: true },
      });

      const pricing = seats.reduce(
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

      const lockExpiresAt = new Date(Date.now() + 300 * 1000).toISOString();

      res.json({
        success: true,
        message: 'Seats locked for 5 minutes',
        data: {
          showId,
          lockedSeats: seats,
          pricing: {
            standardSeats: pricing.standardCount,
            vipSeats: pricing.vipCount,
            standardPrice: show.priceStandard,
            vipPrice: show.priceVip,
            subtotal: pricing.total,
            bookingFee,
            total: grandTotal,
          },
          lockExpiresAt,
          ttlSeconds: 300,
        },
      });
    } catch (error) {
      console.error('lockSeats error:', error);
      res.status(500).json({ success: false, message: 'Failed to lock seats', error: error.message });
    }
  },

  /**
   * POST /api/bookings/confirm
   * Confirm booking using a DB transaction:
   * BEGIN -> verify seats -> mark reserved -> create booking -> clear Redis -> COMMIT
   * Body: { showId, seatIds, userId, paymentMethod }
   */
  async confirmBooking(req, res) {
    try {
      const { showId, seatIds, userId, paymentMethod = 'MOCK_PAYMENT' } = req.body;

      if (!showId || !seatIds || !userId) {
        return res.status(400).json({
          success: false,
          message: 'showId, seatIds, and userId are required',
        });
      }

      // Verify user holds Redis locks for these seats
      const redisLocks = await redisService.getLockedSeats(showId);
      for (const seatId of seatIds) {
        if (redisLocks[seatId] !== userId) {
          return res.status(409).json({
            success: false,
            message: 'Seat lock expired or not held by this user. Please select seats again.',
          });
        }
      }

      // Execute PostgreSQL transaction
      const booking = await prisma.$transaction(async (tx) => {
        // 1. Verify seats are still not reserved (double-check)
        const seats = await tx.seat.findMany({
          where: {
            id: { in: seatIds },
            showId,
            isReserved: false,
          },
        });

        if (seats.length !== seatIds.length) {
          throw new Error('SEATS_ALREADY_RESERVED');
        }

        // 2. Verify user exists
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          // Create a guest user for demo purposes
          throw new Error('USER_NOT_FOUND');
        }

        // 3. Fetch show pricing
        const show = await tx.show.findUnique({
          where: { id: showId },
          select: { priceStandard: true, priceVip: true },
        });

        // 4. Calculate total
        const total = seats.reduce((sum, seat) => {
          return sum + (seat.category === 'VIP' ? show.priceVip : show.priceStandard);
        }, 0);
        const bookingFee = total * 0.02;
        const grandTotal = parseFloat((total + bookingFee).toFixed(2));

        // 5. Generate QR hash
        const qrPayload = {
          bookingId: uuidv4(),
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

        // 6. Create booking record
        const newBooking = await tx.booking.create({
          data: {
            userId,
            showId,
            totalAmount: grandTotal,
            status: 'CONFIRMED',
            qrCodeHash,
          },
        });

        // 7. Create booking seat records
        await tx.bookingSeat.createMany({
          data: seatIds.map((seatId) => ({
            bookingId: newBooking.id,
            seatId,
          })),
        });

        // 8. Mark seats as permanently reserved
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { isReserved: true },
        });

        return { booking: newBooking, qrPayload, seats, show, grandTotal };
      });

      // 9. Clear Redis locks after successful transaction
      await redisService.releaseSeats(showId, seatIds);

      res.json({
        success: true,
        message: 'Booking confirmed successfully!',
        data: {
          bookingId: booking.booking.id,
          status: 'CONFIRMED',
          qrCodeHash: booking.booking.qrCodeHash,
          qrPayload: booking.qrPayload,
          totalAmount: booking.grandTotal,
          seats: booking.seats,
          createdAt: booking.booking.createdAt,
        },
      });
    } catch (error) {
      console.error('confirmBooking error:', error);

      if (error.message === 'SEATS_ALREADY_RESERVED') {
        return res.status(409).json({
          success: false,
          message: 'One or more seats were reserved by another transaction. Please select different seats.',
        });
      }

      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm booking',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/bookings/release-seats
   * Release Redis locks (when user navigates away)
   */
  async releaseSeats(req, res) {
    try {
      const { showId, seatIds } = req.body;
      await redisService.releaseSeats(showId, seatIds);
      res.json({ success: true, message: 'Seats released' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to release seats' });
    }
  },

  /**
   * GET /api/bookings/:id
   * Get booking details
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          show: {
            include: {
              movie: true,
              theater: true,
            },
          },
          seats: {
            include: { seat: true },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
  },

  /**
   * GET /api/bookings/user/:userId
   * Get all bookings for a user
   */
  async getUserBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
          show: {
            include: {
              movie: { select: { title: true, posterUrl: true } },
              theater: { select: { name: true, location: true } },
            },
          },
          seats: { include: { seat: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
  },
};

module.exports = bookingsController;
