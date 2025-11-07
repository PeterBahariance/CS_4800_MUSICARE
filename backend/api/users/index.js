// API endpoint for user operations using Prisma
import { prisma } from '../../lib/prisma.js';

export default async function handler(req, res) {
  // Test endpoint to verify API is working
  if (req.method === 'GET' && req.query.test === 'true') {
    return res.status(200).json({ 
      message: 'Users API is working',
      timestamp: new Date().toISOString()
    });
  }
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

        return res.status(200).json({
          message: 'User found',
          user
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
          error: 'Failed to fetch user',
          details: error.message
        });
      }
    }

    // Update user (PATCH)
    if (req.method === 'PATCH') {
      const { id, firebaseUid } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            firebaseUid: firebaseUid || undefined
          }
        });

        return res.status(200).json({
          message: 'User updated successfully',
          user: updatedUser
        });
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
          error: 'Failed to update user',
          details: error.message
        });
      }
    }

    // Create a new user
    if (req.method === 'POST') {
      const { 
        email, 
        username,
        displayName,
        healthGoals,
        musicPreferences,
        dailyListeningGoal,
        timezone
      } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      try {
        // Check if user already exists by email
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(200).json({
            message: 'User already exists',
            user: existingUser
          });
        }

        // Check if username is taken (if provided)
        if (username) {
          const existingUsername = await prisma.user.findUnique({
            where: { username }
          });

          if (existingUsername) {
            return res.status(400).json({
              error: 'Username already taken'
            });
          }
        }

        // Create new user with all fields
        const user = await prisma.user.create({
          data: {
            email,
            username: username || null,
            displayName: displayName || null,
            emailVerified: false,
            healthGoals: healthGoals || [],
            musicPreferences: musicPreferences || [],
            dailyListeningGoal: dailyListeningGoal || null,
            timezone: timezone || null
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
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
