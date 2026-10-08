const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

// GET /api/movies - List all movies with pagination & search
router.get('/', moviesController.getMovies);

// GET /api/movies/:id - Movie detail with cast & showtimes
router.get('/:id', moviesController.getMovieById);

module.exports = router;
