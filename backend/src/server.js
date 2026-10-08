const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
// Dynamic CORS configuration (supports localhost, IPv6, custom FRONTEND_URL, and Vercel domains)
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Server-to-server, curl, same-origin
  if (process.env.NODE_ENV !== 'production') return true; // Fully permissive during local development
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || /^https?:\/\/\[::1\](:\d+)?$/.test(origin)) {
    return true;
  }
  if (/\.vercel\.app$/.test(origin)) {
    return true;
  }
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.replace(/\/$/, '')) {
    return true;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  if (err && err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('[UNHANDLED ERROR]', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDev && { error: err.message }),
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 FlickPass API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎬 Movies API:  http://localhost:${PORT}/api/movies\n`);
  });
}

module.exports = app;
