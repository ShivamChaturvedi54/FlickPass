const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

// POST /api/bookings/lock-seats - Temporarily lock seats in Firestore
router.post('/lock-seats', bookingsController.lockSeats);

// POST /api/bookings/confirm - Confirm booking with atomic Firestore transaction
router.post('/confirm', bookingsController.confirmBooking);

// POST /api/bookings/release-seats - Release Firestore seat locks
router.post('/release-seats', bookingsController.releaseSeats);

// GET /api/bookings/user/:userId - Get user's booking history from Firestore
router.get('/user/:userId', bookingsController.getUserBookings);

// GET /api/bookings/:id - Get a single booking from Firestore
router.get('/:id', bookingsController.getBookingById);

module.exports = router;
