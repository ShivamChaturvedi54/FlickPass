const prisma = require('../services/prismaClient');
const tmdbService = require('../services/tmdbService');

const moviesController = {
  /**
   * GET /api/movies
   * Fetch all currently playing movies from local DB
   */
  async getMovies(req, res) {
    try {
      const { search, genre, status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) {
        where.status = status;
      }
      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { shows: true } },
          },
        }),
        prisma.movie.count({ where }),
      ]);

      res.json({
        success: true,
        data: movies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('getMovies error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch movies', error: error.message });
    }
  },

  /**
   * GET /api/movies/:id
   * Movie detail with cast info from TMDB and available showtimes
   */
  async getMovieById(req, res) {
    try {
      const { id } = req.params;

      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          shows: {
            where: {
              startTime: { gte: new Date() },
              isActive: true,
            },
            include: {
              theater: true,
              _count: { select: { seats: true } },
            },
            orderBy: { startTime: 'asc' },
            take: 50,
          },
        },
      });

      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      // Initialize with movie's stored values as fallback
      let cast = movie.cast || [];
      let director = movie.director || 'Unknown';
      let trailerUrl = movie.trailerUrl || null;

      try {
        const [credits, videos] = await Promise.all([
          tmdbService.getMovieCredits(movie.tmdbId),
          tmdbService.getMovieVideos(movie.tmdbId),
        ]);
        if (credits && credits.cast && credits.cast.length > 0) cast = credits.cast;
        if (credits && credits.director) director = credits.director;
        if (videos && videos.trailer) trailerUrl = videos.trailer;
      } catch (tmdbErr) {
        // TMDB not available - smoothly fall back to verified seeded trailer & cast
      }

      // Group shows by theater and date
      const showsByTheater = {};
      for (const show of movie.shows) {
        const theaterId = show.theaterId;
        if (!showsByTheater[theaterId]) {
          showsByTheater[theaterId] = {
            theater: show.theater,
            shows: [],
          };
        }
        showsByTheater[theaterId].shows.push(show);
      }

      res.json({
        success: true,
        data: {
          ...movie,
          cast,
          director,
          trailerUrl,
          showsByTheater: Object.values(showsByTheater),
        },
      });
    } catch (error) {
      console.error('getMovieById error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch movie', error: error.message });
    }
  },
};

module.exports = moviesController;
