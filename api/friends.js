// API endpoint for friend operations
import { prisma } from '../lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    if (req.method === 'GET') {
      const { action, userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (action === 'friends') {
        // Get user's friends
        const friends = await prisma.friend.findMany({
          where: {
            OR: [
              { userId: userId },
              { friendId: userId }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                healthGoals: true,
                musicPreferences: true
              }
            },
            friend: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                healthGoals: true,
                musicPreferences: true
              }
            }
          }
        });

        // Format the response to show the friend (not the current user)
        const formattedFriends = friends.map(friendship => {
          const friend = friendship.userId === userId ? friendship.friend : friendship.user;
          return {
            id: friendship.id,
            friend: friend,
            createdAt: friendship.createdAt
          };
        });

        return res.status(200).json({ friends: formattedFriends });
      }

      if (action === 'requests') {
        // Get pending friend requests for the user
        const requests = await prisma.friendRequest.findMany({
          where: {
            receiverId: userId,
            status: 'PENDING'
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                healthGoals: true,
                musicPreferences: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return res.status(200).json({ requests });
      }

      if (action === 'sent') {
        // Get sent friend requests
        const sentRequests = await prisma.friendRequest.findMany({
          where: {
            senderId: userId
          },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return res.status(200).json({ sentRequests });
      }

      return res.status(400).json({ error: 'Invalid action parameter' });
    }

    if (req.method === 'POST') {
      const { action, senderId, receiverId, requestId } = req.body;

      if (action === 'send') {
        // Send friend request
        if (!senderId || !receiverId) {
          return res.status(400).json({ error: 'senderId and receiverId are required' });
        }

        if (senderId === receiverId) {
          return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        // Check if users exist
        const [sender, receiver] = await Promise.all([
          prisma.user.findUnique({ where: { id: senderId } }),
          prisma.user.findUnique({ where: { id: receiverId } })
        ]);

        if (!sender || !receiver) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if they're already friends
        const existingFriendship = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId: senderId, friendId: receiverId },
              { userId: receiverId, friendId: senderId }
            ]
          }
        });

        if (existingFriendship) {
          return res.status(400).json({ error: 'Users are already friends' });
        }

        // Check if request already exists
        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId }
            ],
            status: 'PENDING'
          }
        });

        if (existingRequest) {
          return res.status(400).json({ error: 'Friend request already exists' });
        }

        // Create friend request
        const friendRequest = await prisma.friendRequest.create({
          data: {
            senderId,
            receiverId,
            status: 'PENDING'
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true
              }
            },
            receiver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true
              }
            }
          }
        });

        return res.status(201).json({ 
          message: 'Friend request sent successfully',
          request: friendRequest 
        });
      }

      if (action === 'accept') {
        // Accept friend request
        if (!requestId) {
          return res.status(400).json({ error: 'requestId is required' });
        }

        const friendRequest = await prisma.friendRequest.findUnique({
          where: { id: requestId },
          include: {
            sender: true,
            receiver: true
          }
        });

        if (!friendRequest) {
          return res.status(404).json({ error: 'Friend request not found' });
        }

        if (friendRequest.status !== 'PENDING') {
          return res.status(400).json({ error: 'Friend request is not pending' });
        }

        // Create friendship and update request status
        const [friendship, updatedRequest] = await Promise.all([
          prisma.friend.create({
            data: {
              userId: friendRequest.senderId,
              friendId: friendRequest.receiverId
            }
          }),
          prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
          })
        ]);

        return res.status(200).json({ 
          message: 'Friend request accepted',
          friendship,
          request: updatedRequest
        });
      }

      if (action === 'decline') {
        // Decline friend request
        if (!requestId) {
          return res.status(400).json({ error: 'requestId is required' });
        }

        const updatedRequest = await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'DECLINED' }
        });

        return res.status(200).json({ 
          message: 'Friend request declined',
          request: updatedRequest
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'DELETE') {
      // Remove friend
      const { userId, friendId } = req.body;

      if (!userId || !friendId) {
        return res.status(400).json({ error: 'userId and friendId are required' });
      }

      const friendship = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      if (!friendship) {
        return res.status(404).json({ error: 'Friendship not found' });
      }

      await prisma.friend.delete({
        where: { id: friendship.id }
      });

      return res.status(200).json({ message: 'Friend removed successfully' });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Friends API Error:', error);
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
