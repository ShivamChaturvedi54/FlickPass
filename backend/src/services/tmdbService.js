const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
  timeout: 10000,
});

const tmdbService = {
  /**
   * Build full poster URL from poster_path
   */
  getPosterUrl(posterPath, size = 'w500') {
    if (!posterPath) return null;
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  },

  /**
   * Build full backdrop URL from backdrop_path
   */
  getBackdropUrl(backdropPath) {
    if (!backdropPath) return null;
    return `${BACKDROP_BASE}${backdropPath}`;
  },

  /**
   * Fetch Now Playing movies from TMDB
   */
  async getNowPlaying(page = 1) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get('/movie/now_playing', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Fetch Upcoming movies from TMDB
   */
  async getUpcoming(page = 1) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get('/movie/upcoming', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Fetch full movie details including runtime, genres
   */
  async getMovieDetails(tmdbId) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get(`/movie/${tmdbId}`);
    return response.data;
  },

  /**
   * Fetch movie credits (cast & crew)
   */
  async getMovieCredits(tmdbId) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get(`/movie/${tmdbId}/credits`);
    const { cast, crew } = response.data;
    return {
      cast: cast.slice(0, 12).map((member) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profileUrl: member.profile_path ? tmdbService.getPosterUrl(member.profile_path, 'w185') : null,
      })),
      director: crew.find((m) => m.job === 'Director')?.name || 'Unknown',
    };
  },

  /**
   * Fetch movie videos (trailers, teasers)
   */
  async getMovieVideos(tmdbId) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get(`/movie/${tmdbId}/videos`);
    const videos = response.data.results;
    const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.find((v) => v.site === 'YouTube');
    return {
      trailer: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
      all: videos,
    };
  },

  /**
   * Search movies
   */
  async searchMovies(query, page = 1) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY not configured');
    }
    const response = await tmdbClient.get('/search/movie', {
      params: { query, page },
    });
    return response.data;
  },
};

module.exports = tmdbService;
