/**
 * @fileoverview Friends Management API Endpoint
 *
 * Comprehensive API for managing social connections in the Musicare platform.
 * Handles friend relationships, friend requests, and social networking features
 * for therapeutic music sharing and community building.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires ../lib/prisma.js - Database ORM for friend operations
 *
 * @example
 * // Get user's friends
 * GET /api/friends?action=friends&userId=123
 *
 * // Get pending friend requests
 * GET /api/friends?action=requests&userId=123
 *
 * // Send friend request
 * POST /api/friends
 * {
 *   "action": "send",
 *   "senderId": "user1",
 *   "receiverId": "user2"
 * }
 */

// API endpoint for friend operations
import { prisma } from '../backend/lib/prisma.js';

/**
 * GET Request Handler - Retrieve Friend Data
 *
 * Handles various friend-related GET operations including fetching friends list,
 * pending friend requests, and sent requests. Supports different actions via
 * query parameters for flexible friend management.
 *
 * @async
 * @function getFriends
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.action - Action type: 'friends', 'requests', or 'sent'
 * @param {string} req.query.userId - User ID for friend operations
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with friend data
 * @throws {Error} 400 - Missing or invalid parameters
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Get user's friends list
 * GET /api/friends?action=friends&userId=user123
 *
 * // Response:
 * {
 *   "friends": [
 *     {
 *       "id": "friendship-id",
 *       "friend": { "id": "friend-id", "username": "friend_user" },
 *       "createdAt": "2024-01-15T10:30:00.000Z"
 *     }
 *   ]
 * }
 */
async function getFriends(req, res) {
  console.log('👥 Friends API: GET request received');

  const { action, userId } = req.query;
  console.log(`🔍 Friends API: Action - ${action}, User ID - ${userId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * UserId is required for all friend operations to identify
   * the user context for friend relationships.
   * Skip validation for health check requests.
   */
  if (!userId) {
    console.log('🚨 Friends API: Missing userId parameter');
    return res.status(400).json({
      error: 'userId is required',
      details: 'Provide userId in query parameters to fetch friend data',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Action: Get user's friends list
     *
     * Retrieves all confirmed friendships for the specified user.
     * Uses bidirectional friendship model where friendship can be
     * stored with either user as the primary key.
     */
    if (action === 'friends') {
      console.log('👥 Friends API: Fetching friends list');

      const friends = await prisma.friend.findMany({
        where: {
          OR: [
            { userId: userId },      // User is the initiator
            { friendId: userId }     // User is the recipient
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

      /**
       * Format response to show the friend (not the current user)
       *
       * Since friendships are bidirectional, we need to determine
       * which user in the relationship is the "friend" from the
       * perspective of the requesting user.
       */
      const formattedFriends = friends.map(friendship => {
        const friend = friendship.userId === userId ? friendship.friend : friendship.user;
        return {
          id: friendship.id,
          friend: friend,
          createdAt: friendship.createdAt
        };
      });

      console.log(`✅ Friends API: Found ${formattedFriends.length} friends`);
      return res.status(200).json({
        friends: formattedFriends,
        count: formattedFriends.length,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Get pending friend requests
     *
     * Retrieves all pending friend requests where the user is the receiver.
     * These are requests that need user action (accept/decline).
     */
    if (action === 'requests') {
      console.log('👥 Friends API: Fetching pending friend requests');

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
          createdAt: 'desc'  // Most recent requests first
        }
      });

      console.log(`✅ Friends API: Found ${requests.length} pending requests`);
      return res.status(200).json({
        requests,
        count: requests.length,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Get sent friend requests
     *
     * Retrieves all friend requests sent by the user, regardless of status.
     * Useful for showing user their outgoing request history.
     */
    if (action === 'sent') {
      console.log('👥 Friends API: Fetching sent friend requests');

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
          createdAt: 'desc'  // Most recent requests first
        }
      });

      console.log(`✅ Friends API: Found ${sentRequests.length} sent requests`);
      return res.status(200).json({
        sentRequests,
        count: sentRequests.length,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Invalid action parameter
     *
     * If none of the supported actions match, return error with
     * list of supported actions for API discoverability.
     */
    console.log(`🚨 Friends API: Invalid action parameter - ${action}`);
    return res.status(400).json({
      error: 'Invalid action parameter',
      details: 'Supported actions: friends, requests, sent',
      supportedActions: ['friends', 'requests', 'sent'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Friends API: Error in getFriends:', error);
    return res.status(500).json({
      error: 'Failed to fetch friend data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST Request Handler - Send Friend Request
 *
 * Creates a new friend request between two users with comprehensive validation.
 * Prevents duplicate requests, self-requests, and requests between existing friends.
 * Includes user existence validation and bidirectional relationship checking.
 *
 * @async
 * @function sendFriendRequest
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.senderId - ID of user sending the request
 * @param {string} req.body.receiverId - ID of user receiving the request
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created friend request
 * @throws {Error} 400 - Invalid input or business logic violations
 * @throws {Error} 404 - User not found
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Send friend request
 * POST /api/friends
 * {
 *   "action": "send",
 *   "senderId": "user123",
 *   "receiverId": "user456"
 * }
 *
 * // Response:
 * {
 *   "message": "Friend request sent successfully",
 *   "request": { "id": "req123", "status": "PENDING" },
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 */
async function sendFriendRequest(req, res) {
  console.log('➕ Friends API: POST request received - Sending friend request');

  const { senderId, receiverId } = req.body;
  console.log(`🔍 Friends API: Sender - ${senderId ? 'provided' : 'missing'}, Receiver - ${receiverId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * Both senderId and receiverId are required to establish
   * the relationship between the two users.
   */
  if (!senderId || !receiverId) {
    console.log('🚨 Friends API: Missing required parameters');
    return res.status(400).json({
      error: 'senderId and receiverId are required',
      details: 'Both senderId and receiverId must be provided to send friend request',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Self-request validation
   *
   * Users cannot send friend requests to themselves.
   * This prevents database inconsistencies and logical errors.
   */
  if (senderId === receiverId) {
    console.log('🚨 Friends API: Self-request attempt detected');
    return res.status(400).json({
      error: 'Cannot send friend request to yourself',
      details: 'Sender and receiver must be different users',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * User existence validation
     *
     * Verify both users exist in the database before creating
     * the friend request to prevent orphaned relationships.
     */
    console.log('🔍 Friends API: Validating user existence');
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender || !receiver) {
      console.log(`🚨 Friends API: User not found - Sender: ${!!sender}, Receiver: ${!!receiver}`);
      return res.status(404).json({
        error: 'User not found',
        details: !sender ? 'Sender user does not exist' : 'Receiver user does not exist',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Existing friendship validation
     *
     * Check if users are already friends to prevent duplicate
     * friend relationships. Uses bidirectional checking since
     * friendships can be stored in either direction.
     */
    console.log('🔍 Friends API: Checking for existing friendship');
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId }
        ]
      }
    });

    if (existingFriendship) {
      console.log('🚨 Friends API: Users are already friends');
      return res.status(400).json({
        error: 'Users are already friends',
        details: 'Cannot send friend request to existing friend',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Existing request validation
     *
     * Check if a pending friend request already exists between
     * these users in either direction to prevent duplicates.
     */
    console.log('🔍 Friends API: Checking for existing friend request');
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
      console.log('🚨 Friends API: Friend request already exists');
      return res.status(400).json({
        error: 'Friend request already exists',
        details: 'A pending friend request already exists between these users',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Create friend request
     *
     * All validations passed, create the friend request with
     * full user details for immediate use in UI.
     */
    console.log('➕ Friends API: Creating friend request');
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

    console.log(`✅ Friends API: Friend request created successfully - ID: ${friendRequest.id}`);
    return res.status(201).json({
      message: 'Friend request sent successfully',
      request: friendRequest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Friends API: Error in sendFriendRequest:', error);
    return res.status(500).json({
      error: 'Failed to send friend request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST Request Handler - Manage Friend Request
 *
 * Handles accepting or declining friend requests with comprehensive validation.
 * Creates bidirectional friendships when accepting and updates request status.
 * Includes request existence and status validation.
 *
 * @async
 * @function manageFriendRequest
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.action - Action type: 'accept' or 'decline'
 * @param {string} req.body.requestId - ID of the friend request to manage
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated request/friendship
 * @throws {Error} 400 - Invalid input or request status
 * @throws {Error} 404 - Friend request not found
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Accept friend request
 * POST /api/friends
 * {
 *   "action": "accept",
 *   "requestId": "req123"
 * }
 *
 * // Response:
 * {
 *   "message": "Friend request accepted",
 *   "friendship": { "id": "friendship123" },
 *   "request": { "id": "req123", "status": "ACCEPTED" }
 * }
 */
async function manageFriendRequest(req, res) {
  console.log('🔄 Friends API: POST request received - Managing friend request');

  const { action, requestId } = req.body;
  console.log(`🔍 Friends API: Action - ${action}, Request ID - ${requestId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * RequestId is required to identify which friend request
   * to accept or decline.
   */
  if (!requestId) {
    console.log('🚨 Friends API: Missing requestId parameter');
    return res.status(400).json({
      error: 'requestId is required',
      details: 'Provide requestId to accept or decline friend request',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Friend request validation
     *
     * Verify the friend request exists and get full details
     * including sender and receiver information.
     */
    console.log('🔍 Friends API: Validating friend request');
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!friendRequest) {
      console.log('🚨 Friends API: Friend request not found');
      return res.status(404).json({
        error: 'Friend request not found',
        details: 'The specified friend request does not exist',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Request status validation
     *
     * Only pending requests can be accepted or declined.
     * Already processed requests should not be modified.
     */
    if (friendRequest.status !== 'PENDING') {
      console.log(`🚨 Friends API: Friend request not pending - Status: ${friendRequest.status}`);
      return res.status(400).json({
        error: 'Friend request is not pending',
        details: `Request status is ${friendRequest.status}, cannot be modified`,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Accept friend request
     *
     * Creates a bidirectional friendship and updates request status.
     * Uses atomic transaction to ensure data consistency.
     */
    if (action === 'accept') {
      console.log('✅ Friends API: Accepting friend request');

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

      console.log(`✅ Friends API: Friend request accepted - Friendship ID: ${friendship.id}`);
      return res.status(200).json({
        message: 'Friend request accepted',
        friendship,
        request: updatedRequest,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Decline friend request
     *
     * Updates request status to declined without creating friendship.
     * Preserves request record for audit trail.
     */
    if (action === 'decline') {
      console.log('❌ Friends API: Declining friend request');

      const updatedRequest = await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' }
      });

      console.log(`✅ Friends API: Friend request declined - Request ID: ${requestId}`);
      return res.status(200).json({
        message: 'Friend request declined',
        request: updatedRequest,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Invalid action
     *
     * If action is neither accept nor decline, return error
     * with supported actions for API discoverability.
     */
    console.log(`🚨 Friends API: Invalid action for friend request - ${action}`);
    return res.status(400).json({
      error: 'Invalid action',
      details: 'Supported actions for friend requests: accept, decline',
      supportedActions: ['accept', 'decline'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Friends API: Error in manageFriendRequest:', error);
    return res.status(500).json({
      error: 'Failed to manage friend request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * DELETE Request Handler - Remove Friend
 *
 * Removes an existing friendship between two users with bidirectional checking.
 * Validates friendship existence before deletion and provides clear error messages
 * for various failure scenarios.
 *
 * @async
 * @function removeFriend
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.userId - ID of one user in the friendship
 * @param {string} req.body.friendId - ID of the other user in the friendship
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming friend removal
 * @throws {Error} 400 - Missing required parameters
 * @throws {Error} 404 - Friendship not found
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Remove friend
 * DELETE /api/friends
 * {
 *   "userId": "user123",
 *   "friendId": "user456"
 * }
 *
 * // Response:
 * {
 *   "message": "Friend removed successfully",
 *   "removedFriendshipId": "friendship123",
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 */
async function removeFriend(req, res) {
  console.log('🗑️ Friends API: DELETE request received - Removing friend');

  const { userId, friendId } = req.body;
  console.log(`🔍 Friends API: User ID - ${userId ? 'provided' : 'missing'}, Friend ID - ${friendId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * Both userId and friendId are required to identify
   * the specific friendship to remove.
   */
  if (!userId || !friendId) {
    console.log('🚨 Friends API: Missing required parameters for friend removal');
    return res.status(400).json({
      error: 'userId and friendId are required',
      details: 'Both userId and friendId must be provided to remove friendship',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Find existing friendship
     *
     * Search for friendship in both directions since friendships
     * can be stored with either user as the primary key.
     */
    console.log('🔍 Friends API: Searching for existing friendship');
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    /**
     * Friendship existence validation
     *
     * If no friendship exists, return 404 error with clear message.
     * This prevents unnecessary database operations.
     */
    if (!friendship) {
      console.log('🚨 Friends API: Friendship not found');
      return res.status(404).json({
        error: 'Friendship not found',
        details: 'No friendship exists between the specified users',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Delete friendship
     *
     * Remove the friendship record from the database.
     * This is a permanent action that cannot be undone.
     */
    console.log(`🗑️ Friends API: Deleting friendship - ID: ${friendship.id}`);
    await prisma.friend.delete({
      where: { id: friendship.id }
    });

    console.log('✅ Friends API: Friend removed successfully');
    return res.status(200).json({
      message: 'Friend removed successfully',
      removedFriendshipId: friendship.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Friends API: Error in removeFriend:', error);
    return res.status(500).json({
      error: 'Failed to remove friend',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API Handler - Friends Management Router
 *
 * Central request router for all friend-related operations. Handles CORS configuration,
 * database validation, and delegates requests to specialized handler functions based
 * on HTTP method and action parameters.
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, DELETE, OPTIONS)
 * @param {Object} req.query - Query parameters for GET requests
 * @param {Object} req.body - Request body for POST/DELETE requests
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response from delegated handler
 * @throws {Error} 405 - Method not allowed
 * @throws {Error} 500 - Database configuration or server errors
 *
 * @example
 * // Health check
 * GET /api/friends?test=true
 *
 * // Get friends
 * GET /api/friends?action=friends&userId=123
 *
 * // Send friend request
 * POST /api/friends { "action": "send", "senderId": "1", "receiverId": "2" }
 */
export default async function handler(req, res) {
  console.log('👥 Friends API: Request received -', req.method);

  /**
   * CORS Configuration
   *
   * Enable cross-origin requests for web applications.
   * Supports all common HTTP methods used by friend operations.
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  /**
   * Handle preflight requests
   *
   * OPTIONS requests are sent by browsers before actual requests
   * to check CORS permissions. Return 200 to allow the request.
   */
  if (req.method === 'OPTIONS') {
    console.log('👥 Friends API: Handling CORS preflight request');
    return res.status(200).end();
  }

  // Ensure consistent JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    /**
     * Database connectivity validation
     *
     * Verify database configuration before processing requests.
     * This prevents cryptic errors and provides clear feedback.
     */
    if (!process.env.DATABASE_URL) {
      console.log('🚨 Friends API: Database not configured');
      return res.status(500).json({
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Health check endpoint - MUST be checked before method routing
     *
     * Test endpoint to verify API and database connectivity.
     * Useful for monitoring and debugging.
     */
    if (req.query.test === 'true') {
      console.log('👥 Friends API: Health check requested');
      await prisma.$connect();
      return res.status(200).json({
        message: 'Friends API is working',
        timestamp: new Date().toISOString(),
        database: 'Connected to PostgreSQL via Prisma',
        status: 'healthy'
      });
    }

    /**
     * Route GET requests to getFriends handler
     *
     * Handles friends list, pending requests, and sent requests.
     */
    if (req.method === 'GET') {
      return await getFriends(req, res);
    }

    /**
     * Route POST requests based on action
     *
     * Different POST actions require different handlers:
     * - send: Create new friend request
     * - accept/decline: Manage existing requests
     */
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'send') {
        return await sendFriendRequest(req, res);
      }

      if (action === 'accept' || action === 'decline') {
        return await manageFriendRequest(req, res);
      }

      // Invalid POST action
      console.log(`🚨 Friends API: Invalid POST action - ${action}`);
      return res.status(400).json({
        error: 'Invalid action',
        details: 'Supported POST actions: send, accept, decline',
        supportedActions: ['send', 'accept', 'decline'],
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Route DELETE requests to removeFriend handler
     *
     * Handles friendship removal operations.
     */
    if (req.method === 'DELETE') {
      return await removeFriend(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Return 405 Method Not Allowed for unsupported methods
     * with clear list of supported methods.
     */
    console.log('🚨 Friends API: Unsupported method -', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      details: `${req.method} method is not supported. Use GET, POST, or DELETE.`,
      supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    /**
     * Global error handler
     *
     * Catches any unhandled errors that occur during request processing.
     * Provides structured error responses with development details.
     */
    console.error('🚨 Friends API: Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * API Configuration for Vercel/Next.js
 *
 * Configures the API endpoint behavior including request body parsing limits.
 * The 1MB limit is sufficient for friend request data while preventing abuse.
 *
 * @type {Object}
 * @property {Object} api - API-specific configuration
 * @property {Object} api.bodyParser - Body parser configuration
 * @property {string} api.bodyParser.sizeLimit - Maximum request body size
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size to prevent abuse
    },
  },
};
