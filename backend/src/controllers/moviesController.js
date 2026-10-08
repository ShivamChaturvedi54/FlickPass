const firestoreService = require('../services/firestoreService');
const tmdbService = require('../services/tmdbService');

const moviesController = {
  /**
   * GET /api/movies
   * Fetch movies from Firestore
   */
  async getMovies(req, res) {
    try {
      const { search, genre, status, page = 1, limit = 20 } = req.query;

      const result = await firestoreService.getMovies({
        search,
        status,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.movies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error('getMovies error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch movies', error: error.message });
    }
  },

  /**
   * GET /api/movies/:id
   * Movie detail with cast info and available showtimes from Firestore
   */
  async getMovieById(req, res) {
    try {
      const { id } = req.params;

      const movie = await firestoreService.getMovieById(id);

      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      // Initialize with stored values as baseline
      let cast = movie.cast || [];
      let director = movie.director || 'Unknown';
      let trailerUrl = movie.trailerUrl || null;

      try {
        if (movie.tmdbId) {
          const [credits, videos] = await Promise.all([
            tmdbService.getMovieCredits(movie.tmdbId),
            tmdbService.getMovieVideos(movie.tmdbId),
          ]);
          if (credits && credits.cast && credits.cast.length > 0) cast = credits.cast;
          if (credits && credits.director) director = credits.director;
          if (videos && videos.trailer) trailerUrl = videos.trailer;
        }
      } catch (tmdbErr) {
        // TMDB gracefully skipped
      }

      res.json({
        success: true,
        data: {
          ...movie,
          cast,
          director,
          trailerUrl,
        },
      });
    } catch (error) {
      console.error('getMovieById error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch movie', error: error.message });
    }
  },
};

module.exports = moviesController;
