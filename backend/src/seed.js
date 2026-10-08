const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const firestoreService = require('./services/firestoreService');

async function runSeed() {
  console.log('🚀 Running FlickPass Firebase Seeder...');
  try {
    await firestoreService.seedIfEmpty();
    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
