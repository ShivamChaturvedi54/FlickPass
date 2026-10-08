require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin, local tools, Vercel deployments, or configured FRONTEND_URL
    if (!origin) return callback(null, true);
    if (
      !process.env.FRONTEND_URL ||
      origin === process.env.FRONTEND_URL ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes (mounted on both /api/* and root in case rewrites strip or keep /api prefix)
const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const showsRoutes = require('./routes/shows');
const bookingsRoutes = require('./routes/bookings');

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/movies', '/movies'], moviesRoutes);
app.use(['/api/shows', '/shows'], showsRoutes);
app.use(['/api/bookings', '/bookings'], bookingsRoutes);

// Health check
app.get(['/api/health', '/health'], async (req, res) => {
  const redisService = require('./services/redisService');
  const prisma = require('./services/prismaClient');

  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }

  try {
    const redisPing = await redisService.ping();
    redisStatus = redisPing ? 'connected' : 'disconnected';
  } catch (e) {
    redisStatus = `error: ${e.message}`;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 FlickPass API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎬 Movies API:  http://localhost:${PORT}/api/movies\n`);
  });
}

module.exports = app;
