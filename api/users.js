// API endpoint for user operations using Prisma
import { prisma } from '../lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check database configuration
    if (!process.env.DATABASE_URL) {
      console.error('Database not configured: DATABASE_URL is missing');
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
          message: 'Users API is working', 
          timestamp: new Date().toISOString(),
          database: 'Connected to PostgreSQL via Prisma'
        });
      } catch (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({ 
          error: 'Failed to connect to database',
          details: error.message 
        });
      }
    }

    // Get user by email or Firebase UID
    if (req.method === 'GET') {
      const { email, firebaseUid } = req.query;

      if (!email && !firebaseUid) {
        return res.status(400).json({
          error: 'Either email or firebaseUid is required'
        });
      }

      try {
        let user = null;

        if (firebaseUid) {
          // Find user by Firebase UID
          user = await prisma.user.findUnique({
            where: { firebaseUid }
          });
        } else if (email) {
          // Find user by email
          user = await prisma.user.findUnique({
            where: { email }
          });
        }

        if (!user) {
          return res.status(404).json({
            error: 'User not found'
          });
        }

        return res.status(200).json(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
          error: 'Failed to fetch user',
          details: error.message
        });
      }
    }

    // Create a new user
    if (req.method === 'POST') {
      const { email, displayName } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(200).json({
            message: 'User already exists',
            user: existingUser
          });
        }

        // Create new user
        const user = await prisma.user.create({
          data: {
            email,
            displayName: displayName || null,
            emailVerified: false
          }
        });

        return res.status(201).json({
          message: 'User created successfully',
          user
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          error: 'Failed to create user',
          details: error.message
        });
      }
    }

    // Update user with Firebase UID
    if (req.method === 'PATCH') {
      const { email, firebaseUid } = req.body;

      if (!email || !firebaseUid) {
        return res.status(400).json({
          error: 'Both email and firebaseUid are required'
        });
      }

      try {
        // Update user with Firebase UID
        const user = await prisma.user.update({
          where: { email },
          data: { firebaseUid }
        });

        return res.status(200).json({
          message: 'User updated successfully',
          user
        });
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
          error: 'Failed to update user',
          details: error.message
        });
      }
    }

    // Handle unsupported methods
    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
