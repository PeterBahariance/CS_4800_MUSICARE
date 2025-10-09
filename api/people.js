// API endpoint for people operations using Prisma
import { prisma } from '../lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    // Test database connection first
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing'
      });
    }

    // Test endpoint
    if (req.query.test === 'true') {
      try {
        // Test database connection
        await prisma.$connect();
        return res.status(200).json({ 
          message: 'People API is working', 
          timestamp: new Date().toISOString(),
          hasDatabase: !!process.env.DATABASE_URL,
          nodeVersion: process.version,
          databaseConnected: true
        });
      } catch (dbError) {
        return res.status(500).json({ 
          message: 'People API is working but database connection failed',
          timestamp: new Date().toISOString(),
          hasDatabase: !!process.env.DATABASE_URL,
          nodeVersion: process.version,
          databaseConnected: false,
          dbError: dbError.message
        });
      }
    }
    
    if (req.method === 'GET') {
      // Get all people from the database
      const people = await prisma.people.findMany({
        orderBy: { id: 'asc' }
      });
      
      return res.status(200).json({ people });
    }

    if (req.method === 'POST') {
      // Check if we're populating the database with sample data
      if (req.body.action === 'populate') {
        // Sample data to populate
        const samplePeople = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
          { firstName: 'Bob', lastName: 'Johnson' }
        ];

        // Clear existing data first (for demo purposes)
        await prisma.people.deleteMany({});

        // Insert sample data
        const createdPeople = await prisma.people.createMany({
          data: samplePeople
        });

        // Fetch the created records to return them
        const people = await prisma.people.findMany({
          orderBy: { id: 'asc' }
        });

        return res.status(201).json({ 
          message: 'Database populated successfully',
          count: createdPeople.count,
          people 
        });
      }

      // Handle individual person creation
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields: firstName and lastName' });
      }

      const person = await prisma.people.create({
        data: {
          firstName,
          lastName
        }
      });

      return res.status(201).json({ person });
    }

    if (req.method === 'DELETE') {
      // Clear all people from the database
      const deletedCount = await prisma.people.deleteMany({});

      return res.status(200).json({
        message: 'All people deleted successfully',
        deletedCount: deletedCount.count
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('People API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
