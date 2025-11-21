/**
 * Database Migration Script
 * 
 * This script migrates all data from the old database to a new one.
 * 
 * Usage:
 * 1. Set OLD_DATABASE_URL in .env.local (current database)
 * 2. Set NEW_DATABASE_URL in .env.local (new database)
 * 3. Run: node scripts/migrate-database.js
 */

import { PrismaClient } from '@prisma/client';

// Old database connection
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// New database connection
const newDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEW_DATABASE_URL
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Get all table names from your Prisma schema
    // Order matters! Tables with foreign keys must come after their dependencies
    const tables = [
      'file',        // No dependencies
      'people',      // No dependencies
      'user',        // No dependencies
      'friend',      // Depends on User
      'friendRequest', // Depends on User
      'playlist',    // Depends on User
      'song',        // No dependencies
      'playlistSong', // Depends on Playlist, Song
      'userSavedPlaylist', // Depends on User, Playlist
      'userSavedSong',     // Depends on User, Song
      'chat',        // No dependencies (but has relation to User)
      'chatParticipant',   // Depends on User, Chat
      'message',     // Depends on User, Chat
    ];

    for (const table of tables) {
      console.log(`📦 Migrating ${table}...`);
      
      try {
        // Fetch all records from old database
        const records = await oldDb[table].findMany();
        console.log(`   Found ${records.length} records`);

        if (records.length === 0) {
          console.log(`   ⏭️  Skipping empty table\n`);
          continue;
        }

        // Insert into new database
        for (const record of records) {
          await newDb[table].create({
            data: record
          });
        }

        console.log(`   ✅ Migrated ${records.length} records\n`);
      } catch (error) {
        console.error(`   ❌ Error migrating ${table}:`, error.message);
        console.log(`   ⏭️  Continuing with next table...\n`);
      }
    }

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

// Run migration
migrateData();

