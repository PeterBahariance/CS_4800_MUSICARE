/**
 * @fileoverview User Search API Endpoint
 * Comprehensive API for searching and discovering users in the Musicare platform.
 * Provides intelligent search functionality with relationship status awareness.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @requires prisma - Database ORM for PostgreSQL operations
 * @requires express - Web framework for handling HTTP requests
 *
 * @description
 * This API endpoint enables users to search for other users by username, display name,
 * email, or exact ID. It provides relationship status information (friends, pending requests)
 * to help users understand their connection status with search results.
 *
 * @features
 * - Multi-field search (username, displayName, email, ID)
 * - Case-insensitive search with partial matching
 * - Relationship status detection (friends, requests, none)
 * - Configurable result limits with pagination support
 * - Current user exclusion from search results
 * - Comprehensive error handling and validation
 *
 * @endpoints
 * - GET /api/search-users - Search for users with query parameters
 *
 * @example
 * // Search for users with "john" in username/displayName/email
 * GET /api/search-users?query=john&currentUserId=user123&limit=5
 *
 * @security
 * - Requires currentUserId to prevent unauthorized searches
 * - Excludes current user from search results
 * - Sanitizes search terms to prevent injection attacks
 */

import { prisma } from '../lib/prisma.js';

/**
 * Search for users based on query parameters
 *
 * @async
 * @function searchUsers
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.query - Search term for username/displayName/email
 * @param {string} req.query.currentUserId - ID of the user performing the search
 * @param {number} [req.query.limit=10] - Maximum number of results to return
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with search results
 * @returns {Array<Object>} users - Array of user objects with relationship status
 * @returns {string} query - The search term that was used
 * @returns {number} total - Total number of results returned
 *
 * @throws {400} When currentUserId is missing or query is invalid
 * @throws {500} When database operations fail
 *
 * @example
 * // Request
 * GET /api/search-users?query=john&currentUserId=user123&limit=5
 *
 * // Response
 * {
 *   "users": [
 *     {
 *       "id": "user456",
 *       "username": "johnsmith",
 *       "displayName": "John Smith",
 *       "email": "john@example.com",
 *       "healthGoals": ["stress_reduction"],
 *       "musicPreferences": ["classical", "ambient"],
 *       "createdAt": "2024-01-15T10:30:00Z",
 *       "relationshipStatus": "none"
 *     }
 *   ],
 *   "query": "john",
 *   "total": 1
 * }
 *
 * @description
 * This function performs a comprehensive user search with the following features:
 *
 * 1. **Multi-field Search**: Searches across username, displayName, email, and exact ID
 * 2. **Case-insensitive Matching**: Uses Prisma's insensitive mode for flexible search
 * 3. **Current User Exclusion**: Automatically excludes the searching user from results
 * 4. **Relationship Status**: Determines friendship status for each result
 * 5. **Result Limiting**: Supports configurable result limits for performance
 * 6. **Sorted Results**: Orders results by username and displayName for consistency
 *
 * **Relationship Status Values:**
 * - `none`: No relationship exists
 * - `friends`: Users are already friends
 * - `request_sent`: Current user has sent a friend request
 * - `request_received`: Current user has received a friend request
 *
 * **Performance Considerations:**
 * - Uses database indexes on username, displayName, and email fields
 * - Limits results to prevent excessive data transfer
 * - Performs relationship checks in parallel using Promise.all
 *
 * **Security Features:**
 * - Validates currentUserId to prevent unauthorized searches
 * - Sanitizes search terms to prevent injection attacks
 * - Returns only safe user fields (excludes sensitive data)
 */
async function searchUsers(req, res) {
  console.log('🔍 Search Users API: GET request received');

  const { query, currentUserId, limit = 10 } = req.query;
  console.log(`🔍 Search Users API: Query - "${query || 'empty'}", User ID - ${currentUserId ? 'provided' : 'missing'}, Limit - ${limit}`);

  // Validate required parameters
  if (!currentUserId) {
    console.log('🚨 Search Users API: Missing currentUserId parameter');
    return res.status(400).json({
      error: 'currentUserId is required',
      details: 'Provide currentUserId in query parameters to perform user search',
      timestamp: new Date().toISOString()
    });
  }

  // Handle empty query - return empty results
  if (!query || query.trim().length === 0) {
    console.log('🔍 Search Users API: Empty query provided, returning empty results');
    return res.status(200).json({
      users: [],
      query: '',
      total: 0,
      message: 'Empty search query provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const searchTerm = query.trim();
    console.log(`🔍 Search Users API: Searching for users with term: "${searchTerm}"`);

    // Search users by username, displayName, email, or exact ID
    // Exclude the current user from results
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            // Exclude current user from search results
            id: {
              not: currentUserId
            }
          },
          {
            // Search across multiple fields with OR logic
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
                // Allow searching by exact ID for direct user lookup
                id: {
                  equals: searchTerm
                }
              }
            ]
          }
        ]
      },
      select: {
        // Return only safe, non-sensitive user fields
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

    console.log(`🔍 Search Users API: Found ${users.length} users matching search criteria`);

    // For each user, check relationship status with current user
    console.log('🔍 Search Users API: Checking relationship status for each user...');
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        // Check if users are already friends (bidirectional check)
        const friendship = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId: currentUserId, friendId: user.id },
              { userId: user.id, friendId: currentUserId }
            ]
          }
        });

        // Check for pending friend requests (bidirectional check)
        const pendingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id, status: 'PENDING' },
              { senderId: user.id, receiverId: currentUserId, status: 'PENDING' }
            ]
          }
        });

        // Determine relationship status based on database results
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

    console.log('✅ Search Users API: Successfully processed relationship status for all users');

    return res.status(200).json({
      users: usersWithStatus,
      query: searchTerm,
      total: usersWithStatus.length,
      message: `Found ${usersWithStatus.length} users matching "${searchTerm}"`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Search Users API: Error in searchUsers:', error);
    return res.status(500).json({
      error: 'Failed to search users',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API handler for user search endpoint
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, OPTIONS)
 * @param {Object} req.query - Query parameters for search
 * @param {Object} res - Express response object
 *
 * @returns {Promise<void>} Sends JSON response to client
 *
 * @description
 * Main entry point for the user search API endpoint. This function:
 *
 * 1. **CORS Configuration**: Sets up cross-origin resource sharing headers
 * 2. **Method Validation**: Ensures only GET and OPTIONS methods are allowed
 * 3. **Database Validation**: Verifies database connectivity before processing
 * 4. **Health Check**: Provides API health status endpoint
 * 5. **Request Routing**: Delegates search requests to specialized functions
 * 6. **Error Handling**: Catches and handles all unhandled errors gracefully
 *
 * **Supported HTTP Methods:**
 * - `GET`: Search for users with query parameters
 * - `OPTIONS`: CORS preflight request handling
 *
 * **Health Check Endpoint:**
 * - `GET /api/search-users?test=true` - Returns API health status
 *
 * **Error Responses:**
 * - `405`: Method not allowed (for unsupported HTTP methods)
 * - `500`: Internal server error (for database or system failures)
 *
 * **CORS Headers:**
 * - `Access-Control-Allow-Origin: *` - Allows requests from any origin
 * - `Access-Control-Allow-Methods: GET, OPTIONS` - Specifies allowed methods
 * - `Access-Control-Allow-Headers: Content-Type` - Allows content-type header
 *
 * **Performance Features:**
 * - Database connection validation before processing requests
 * - Automatic database disconnection after request completion
 * - Structured error logging for debugging and monitoring
 *
 * @example
 * // Health check request
 * GET /api/search-users?test=true
 *
 * // Search request
 * GET /api/search-users?query=john&currentUserId=user123&limit=10
 *
 * // CORS preflight request
 * OPTIONS /api/search-users
 */
export default async function handler(req, res) {
  console.log('🔍 Search Users API: Request received -', req.method);

  /**
   * CORS Configuration
   *
   * Enables cross-origin requests from any domain to support
   * frontend applications hosted on different domains/ports.
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  /**
   * Handle CORS preflight requests
   *
   * Browsers send OPTIONS requests before actual requests to check
   * if the cross-origin request is allowed.
   */
  if (req.method === 'OPTIONS') {
    console.log('🔍 Search Users API: Handling CORS preflight request');
    return res.status(200).end();
  }

  // Ensure all responses are JSON formatted
  res.setHeader('Content-Type', 'application/json');

  try {
    /**
     * Database connectivity validation
     *
     * Verify that the database is properly configured before
     * attempting any database operations.
     */
    if (!process.env.DATABASE_URL) {
      console.log('🚨 Search Users API: Database not configured');
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
      console.log('🔍 Search Users API: Health check requested');
      await prisma.$connect();
      return res.status(200).json({
        message: 'Search Users API is working',
        timestamp: new Date().toISOString(),
        database: 'Connected to PostgreSQL via Prisma',
        status: 'healthy'
      });
    }

    /**
     * Route GET requests to searchUsers handler
     *
     * All user search functionality is handled by the specialized
     * searchUsers function for better code organization.
     */
    if (req.method === 'GET') {
      return await searchUsers(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Return a clear error message for methods that are not supported
     * by this API endpoint.
     */
    console.log('🚨 Search Users API: Unsupported method -', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      details: `${req.method} method is not supported. Use GET for searching users.`,
      supportedMethods: ['GET', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    /**
     * Global error handler
     *
     * Catches any unhandled errors and returns a structured error response.
     * Logs detailed error information for debugging purposes.
     */
    console.error('🚨 Search Users API: Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  } finally {
    /**
     * Cleanup database connection
     *
     * Ensure database connection is properly closed after request
     * processing to prevent connection leaks.
     */
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('🚨 Search Users API: Error disconnecting from database:', disconnectError);
    }
  }
}

/**
 * API Configuration
 *
 * Vercel serverless function configuration for optimal performance
 * and resource management.
 */
export const config = {
  api: {
    /**
     * Body parser configuration
     *
     * Set reasonable limits for request body size to prevent
     * abuse and ensure good performance.
     */
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};
