const firestoreService = require('../services/firestoreService');

const bookingsController = {
  /**
   * POST /api/bookings/lock-seats
   * Atomically lock 1-6 seats in Firestore for 5 minutes
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

      const lockResult = await firestoreService.lockSeats(showId, seatIds, userId);

      if (!lockResult.success) {
        return res.status(409).json({
          success: false,
          message: lockResult.message || 'One or more seats are already locked or reserved',
          conflictSeatId: lockResult.conflictSeatId,
        });
      }

      res.json({
        success: true,
        message: 'Seats locked for 5 minutes',
        data: lockResult.data,
      });
    } catch (error) {
      console.error('lockSeats error:', error);
      res.status(500).json({ success: false, message: 'Failed to lock seats', error: error.message });
    }
  },

  /**
   * POST /api/bookings/confirm
   * Confirm booking using an atomic Firestore transaction:
   * Verify seats -> reserve seats -> create booking in Firestore -> clear locks
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

      const result = await firestoreService.confirmBooking({
        showId,
        seatIds,
        userId,
        paymentMethod,
      });

      res.json({
        success: true,
        message: 'Booking confirmed successfully!',
        data: {
          bookingId: result.booking.id,
          status: 'CONFIRMED',
          qrCodeHash: result.booking.qrCodeHash,
          qrPayload: result.booking.qrPayload,
          totalAmount: result.grandTotal,
          seats: result.seats,
          createdAt: result.booking.createdAt,
        },
      });
    } catch (error) {
      console.error('confirmBooking error:', error);

      if (error.message === 'SEATS_ALREADY_RESERVED') {
        return res.status(409).json({
          success: false,
          message: 'One or more seats were already reserved. Please select different seats.',
        });
      }

      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (error.message === 'SHOW_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Show not found' });
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
   * Release seat locks in Firestore
   */
  async releaseSeats(req, res) {
    try {
      const { showId, seatIds } = req.body;
      if (showId && Array.isArray(seatIds)) {
        await firestoreService.releaseSeats(showId, seatIds);
      }
      res.json({ success: true, message: 'Seats released' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to release seats' });
    }
  },

  /**
   * GET /api/bookings/:id
   * Get booking details from Firestore
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const booking = await firestoreService.getBookingById(id);

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
   * Get all bookings for a user from Firestore
   */
  async getUserBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await firestoreService.getUserBookings(userId);

      res.json({ success: true, data: bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
  },
};

module.exports = bookingsController;
