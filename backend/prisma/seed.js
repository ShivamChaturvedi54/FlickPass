const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const THEATERS = [
  { name: 'PVR Cinemas - Nexus Mall', location: 'Koramangala, Bangalore', totalScreens: 8 },
  { name: 'INOX Leisure - Forum Mall', location: 'Whitefield, Bangalore', totalScreens: 6 },
  { name: 'Cinépolis - Orion Mall', location: 'Rajajinagar, Bangalore', totalScreens: 10 },
  { name: 'PVR IMAX - Phoenix Marketcity', location: 'Velachery, Chennai', totalScreens: 5 },
  { name: 'MovieMax - Lulu Mall', location: 'Edapally, Kochi', totalScreens: 7 },
];

const SHOW_TIMES = ['10:00', '13:00', '16:00', '19:30', '22:30'];

async function fetchNowPlayingMovies() {
  console.log('🎬 Fetching Now Playing movies from TMDB...');
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
      },
    });
    return response.data.results.slice(0, 10);
  } catch (error) {
    console.error('TMDB API Error:', error.message);
    return getMockMovies();
  }
}

async function fetchMovieDetails(tmdbId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' },
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

function getMockMovies() {
  console.log('⚠️  Using mock movie data (TMDB API key not set or failed)');
  return [
    { id: 1156593, title: 'You Bear', overview: 'A bear comedy adventure', release_date: '2024-01-15', poster_path: null, backdrop_path: null, genre_ids: [35, 18] },
    { id: 1100782, title: 'Sonic the Hedgehog 3', overview: 'Sonic returns for another adventure', release_date: '2024-12-20', poster_path: null, backdrop_path: null, genre_ids: [28, 35] },
    { id: 558449, title: 'Gladiator II', overview: 'The epic sequel to Gladiator', release_date: '2024-11-22', poster_path: null, backdrop_path: null, genre_ids: [28, 18] },
    { id: 912649, title: 'Venom: The Last Dance', overview: 'Eddie and Venom face their greatest challenge', release_date: '2024-10-25', poster_path: null, backdrop_path: null, genre_ids: [28, 878] },
    { id: 1064028, title: 'Alien: Romulus', overview: 'A group of young colonizers face the alien', release_date: '2024-08-16', poster_path: null, backdrop_path: null, genre_ids: [27, 878] },
    { id: 974635, title: 'The Wild Robot', overview: 'A robot stranded on an uninhabited island', release_date: '2024-09-27', poster_path: null, backdrop_path: null, genre_ids: [16, 878] },
    { id: 1034541, title: 'Terrifier 3', overview: 'Art the Clown terrorizes on Christmas Eve', release_date: '2024-10-11', poster_path: null, backdrop_path: null, genre_ids: [27] },
    { id: 698687, title: 'Transformers One', overview: 'The untold origin story of Optimus Prime', release_date: '2024-09-20', poster_path: null, backdrop_path: null, genre_ids: [16, 28, 878] },
    { id: 1126166, title: 'Smile 2', overview: 'A global pop sensation faces terrifying events', release_date: '2024-10-18', poster_path: null, backdrop_path: null, genre_ids: [27, 53] },
    { id: 762441, title: 'A Quiet Place: Day One', overview: 'Experience the day the world went quiet', release_date: '2024-06-28', poster_path: null, backdrop_path: null, genre_ids: [27, 878, 53] },
  ];
}

function generateSeatsForShow(showId, totalRows = 10) {
  const seats = [];
  const rows = Array.from({ length: totalRows }, (_, i) => String.fromCharCode(65 + i));
  const VIP_ROWS = ['A', 'B'];

  for (const row of rows) {
    const seatsPerRow = row <= 'D' ? 10 : 14;
    for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
      seats.push({
        showId,
        rowLabel: row,
        seatNumber: seatNum,
        category: VIP_ROWS.includes(row) ? 'VIP' : 'STANDARD',
        isReserved: false,
      });
    }
  }
  return seats;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseShowTime(dateBase, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(dateBase);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

async function seed() {
  console.log('\n🌱 Starting FlickPass database seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.theater.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  console.log('👤 Creating demo user...');
  const bcrypt = require('bcryptjs');
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@flickpass.com',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('demo123', 10),
    },
  });
  console.log(`   ✅ Created user: ${demoUser.email}`);

  // Seed theaters
  console.log('\n🎭 Seeding theaters...');
  const createdTheaters = [];
  for (const theater of THEATERS) {
    const t = await prisma.theater.create({ data: theater });
    createdTheaters.push(t);
    console.log(`   ✅ ${t.name}`);
  }

  // Fetch & seed movies
  console.log('\n🎬 Fetching movies from TMDB...');
  const tmdbMovies = await fetchNowPlayingMovies();
  const createdMovies = [];

  for (const tmdbMovie of tmdbMovies) {
    let runtime = 120;
    let rating = tmdbMovie.vote_average || 7.5;

    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      const details = await fetchMovieDetails(tmdbMovie.id);
      if (details) {
        runtime = details.runtime || 120;
        rating = details.vote_average || rating;
      }
    }

    const movie = await prisma.movie.create({
      data: {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview || 'An exciting cinematic experience.',
        durationMins: runtime,
        posterUrl: tmdbMovie.poster_path ? `${POSTER_BASE}${tmdbMovie.poster_path}` : null,
        backdropUrl: tmdbMovie.backdrop_path ? `${BACKDROP_BASE}${tmdbMovie.backdrop_path}` : null,
        releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
        genres: [],
        rating,
        language: tmdbMovie.original_language || 'en',
      },
    });
    createdMovies.push(movie);
    console.log(`   ✅ ${movie.title} (TMDB: ${movie.tmdbId})`);
  }

  // Generate shows for the next 7 days
  console.log('\n📅 Generating showtimes for the next 7 days...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalShows = 0;
  let totalSeats = 0;

  for (let day = 0; day < 7; day++) {
    const showDate = addDays(today, day);

    for (const movie of createdMovies) {
      // Each movie plays in 2 random theaters
      const shuffled = [...createdTheaters].sort(() => Math.random() - 0.5).slice(0, 2);

      for (const theater of shuffled) {
        const screenNumber = Math.floor(Math.random() * theater.totalScreens) + 1;
        // 3 shows per day per theater
        const selectedTimes = SHOW_TIMES.slice(0, 3).sort(() => Math.random() - 0.5).slice(0, 3);

        for (const timeStr of selectedTimes) {
          const startTime = parseShowTime(showDate, timeStr);
          const endTime = new Date(startTime.getTime() + movie.durationMins * 60 * 1000);

          const show = await prisma.show.create({
            data: {
              movieId: movie.id,
              theaterId: theater.id,
              screenNumber,
              startTime,
              endTime,
              priceStandard: 250 + Math.floor(Math.random() * 100),
              priceVip: 500 + Math.floor(Math.random() * 200),
            },
          });

          // Create seats for this show
          const seatData = generateSeatsForShow(show.id);
          await prisma.seat.createMany({ data: seatData });

          totalShows++;
          totalSeats += seatData.length;
        }
      }
    }
  }

  console.log(`\n✅ Seed Complete!`);
  console.log(`   🎬 Movies:    ${createdMovies.length}`);
  console.log(`   🎭 Theaters:  ${createdTheaters.length}`);
  console.log(`   🎟️  Shows:     ${totalShows}`);
  console.log(`   💺 Seats:     ${totalSeats}`);
  console.log(`   👤 Users:     1 (demo@flickpass.com / demo123)\n`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
