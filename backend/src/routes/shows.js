const express = require('express');
const router = express.Router();
const showsController = require('../controllers/showsController');

// GET /api/shows/:id - Show details
router.get('/:id', showsController.getShowById);

// GET /api/shows/:id/seats - Get seat layout with live status
router.get('/:id/seats', showsController.getShowSeats);

module.exports = router;
