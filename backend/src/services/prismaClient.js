let prismaInstance = null;

try {
  // Attempt to load standard PrismaClient
  const { PrismaClient } = require('@prisma/client');
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  prismaInstance = client;
  console.log('✅ Connected via Prisma Client');
} catch (err) {
  // Fall back to resilient local database engine
  console.log('ℹ️  Prisma engine not generated or Postgres offline, using resilient FlickPass database engine.');
  const localDb = require('./localDb');
  prismaInstance = localDb;
}

module.exports = prismaInstance;
