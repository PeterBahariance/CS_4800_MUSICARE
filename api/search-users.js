// API endpoint for searching users
import { prisma } from '../lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection first
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing'
      });
    }

    const { query, currentUserId, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({ users: [] });
    }

    if (!currentUserId) {
      return res.status(400).json({ error: 'currentUserId is required' });
    }

    const searchTerm = query.trim();

    // Search users by username, displayName, or email
    // Exclude the current user from results
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId
            }
          },
          {
            OR: [
              {
                username: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                displayName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                id: {
                  equals: searchTerm // Allow searching by exact ID
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        healthGoals: true,
        musicPreferences: true,
        createdAt: true
      },
      take: parseInt(limit),
      orderBy: [
        {
          username: 'asc'
        },
        {
          displayName: 'asc'
        }
      ]
    });

    // For each user, check if they're already friends or have pending requests
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        // Check if already friends
        const friendship = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId: currentUserId, friendId: user.id },
              { userId: user.id, friendId: currentUserId }
            ]
          }
        });

        // Check for pending friend requests
        const pendingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id, status: 'PENDING' },
              { senderId: user.id, receiverId: currentUserId, status: 'PENDING' }
            ]
          }
        });

        let relationshipStatus = 'none';
        if (friendship) {
          relationshipStatus = 'friends';
        } else if (pendingRequest) {
          if (pendingRequest.senderId === currentUserId) {
            relationshipStatus = 'request_sent';
          } else {
            relationshipStatus = 'request_received';
          }
        }

        return {
          ...user,
          relationshipStatus
        };
      })
    );

    return res.status(200).json({ 
      users: usersWithStatus,
      query: searchTerm,
      total: usersWithStatus.length
    });

  } catch (error) {
    console.error('Search Users API Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
