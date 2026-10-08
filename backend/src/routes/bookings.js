const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

// POST /api/bookings/lock-seats - Temporarily lock seats in Redis
router.post('/lock-seats', bookingsController.lockSeats);

// POST /api/bookings/confirm - Confirm booking with DB transaction
router.post('/confirm', bookingsController.confirmBooking);

// POST /api/bookings/release-seats - Release Redis locks
router.post('/release-seats', bookingsController.releaseSeats);

// GET /api/bookings/user/:userId - Get user's booking history
router.get('/user/:userId', bookingsController.getUserBookings);

// GET /api/bookings/:id - Get a single booking
router.get('/:id', bookingsController.getBookingById);

module.exports = router;
