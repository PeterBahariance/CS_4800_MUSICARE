/**
 * @fileoverview User Management API Endpoint
 *
 * This module handles all user-related operations for the Musicare application.
 * It provides CRUD operations for user accounts, authentication integration,
 * and health/wellness profile management.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-01
 *
 * @requires prisma - Database ORM for PostgreSQL operations
 *
 * @example
 * // GET /api/users - Retrieve all users
 * // POST /api/users - Create new user
 * // PATCH /api/users - Update user profile
 * // GET /api/users?test=true - Health check endpoint
 */

import { prisma } from '../../backend/lib/prisma.js';

/**
 * GET Request Handler - Retrieve User Information
 *
 * Fetches user data from the database using either email or Firebase UID.
 * This endpoint supports user authentication flows and profile lookups.
 * Used by frontend components to load user profiles and verify account status.
 *
 * @async
 * @function getUserData
 * @param {Object} req - Express request object
 * @param {string} req.query.email - User's email address (optional)
 * @param {string} req.query.firebaseUid - Firebase authentication UID (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with user data and metadata
 *
 * @throws {Error} 400 - Missing required parameters (email or firebaseUid)
 * @throws {Error} 404 - User not found in database
 * @throws {Error} 500 - Database connection or query error
 *
 * @example
 * // Get user by email
 * GET /api/users?email=user@example.com
 *
 * @example
 * // Get user by Firebase UID
 * GET /api/users?firebaseUid=firebase-uid-123
 */
async function getUserData(req, res) {
  console.log('🔍 Users API: GET request received');

  // Extract query parameters
  const { email, firebaseUid } = req.query;
  console.log('🔍 Users API: Query params -', {
    email: email ? '***@' + email.split('@')[1] : 'not provided',
    firebaseUid: firebaseUid ? firebaseUid.substring(0, 8) + '...' : 'not provided'
  });

  /**
   * Validate required parameters
   *
   * At least one identifier (email or firebaseUid) must be provided
   * to perform the user lookup. Both are unique identifiers in our system.
   * Firebase UID is preferred as it's more stable than email addresses.
   */
  if (!email && !firebaseUid) {
    console.log('🚨 Users API: Missing required parameters');
    return res.status(400).json({
      error: 'Either email or firebaseUid is required',
      details: 'Provide either email or firebaseUid query parameter',
      timestamp: new Date().toISOString()
    });
  }

  try {
    let user = null;

    /**
     * User lookup by Firebase UID (preferred method)
     *
     * Firebase UID is the primary authentication identifier and is
     * more reliable than email for user lookups since emails can change.
     */
    if (firebaseUid) {
      console.log('🔍 Users API: Looking up user by Firebase UID');
      user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: {
          id: true,
          email: true,
          firebaseUid: true,
          username: true,
          displayName: true,
          emailVerified: true,
          healthGoals: true,
          musicPreferences: true,
          dailyListeningGoal: true,
          timezone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }
    /**
     * User lookup by email (fallback method)
     *
     * Used when Firebase UID is not available, typically during
     * initial authentication flows or account recovery processes.
     */
    else if (email) {
      console.log('🔍 Users API: Looking up user by email');
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firebaseUid: true,
          username: true,
          displayName: true,
          emailVerified: true,
          healthGoals: true,
          musicPreferences: true,
          dailyListeningGoal: true,
          timezone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    /**
     * Handle user not found scenario
     *
     * Returns 404 status to distinguish between "user doesn't exist"
     * and other error conditions. This helps frontend handle different
     * scenarios appropriately (e.g., redirect to registration).
     */
    if (!user) {
      console.log('🔍 Users API: User not found');
      return res.status(404).json({
        error: 'User not found',
        details: 'No user exists with the provided identifier',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Users API: User found successfully');
    return res.status(200).json({
      message: 'User found',
      user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Users API: Error fetching user:', error);
    return res.status(500).json({
      error: 'Failed to fetch user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * PATCH Request Handler - Update User Profile
 *
 * Updates existing user information in the database. Supports updating
 * multiple profile fields including username, displayName, health goals,
 * music preferences, and more.
 *
 * @async
 * @function updateUser
 * @param {Object} req - Express request object
 * @param {string} req.body.id - User's database ID (required)
 * @param {string} req.body.firebaseUid - Firebase authentication UID (optional)
 * @param {string} req.body.username - Unique username (optional)
 * @param {string} req.body.displayName - User's display name (optional)
 * @param {string} req.body.email - User email (optional)
 * @param {string[]} req.body.healthGoals - Array of health goals (optional)
 * @param {string[]} req.body.musicPreferences - Array of music preferences (optional)
 * @param {number} req.body.dailyListeningGoal - Daily listening goal in minutes (optional)
 * @param {string} req.body.timezone - User's timezone (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated user data
 *
 * @throws {Error} 400 - Missing required parameters
 * @throws {Error} 404 - User not found (handled by Prisma)
 * @throws {Error} 409 - Firebase UID already in use
 * @throws {Error} 500 - Database or server error
 *
 * @example
 * PATCH /api/users
 * {
 *   "id": "user-uuid-123",
 *   "username": "newusername",
 *   "displayName": "New Display Name",
 *   "healthGoals": ["stress_relief", "focus"],
 *   "musicPreferences": ["classical", "jazz"],
 *   "dailyListeningGoal": 45,
 *   "timezone": "America/Los_Angeles"
 * }
 */
async function updateUser(req, res) {
  console.log('🔄 Users API: PATCH request received');

  // Extract ALL fields from request body
  const {
    id,
    firebaseUid,
    username,
    displayName,
    email,
    healthGoals,
    musicPreferences,
    dailyListeningGoal,
    timezone
  } = req.body;

  // Log request details
  console.log('🔄 Users API: Update data -', {
    id: id ? id.substring(0, 8) + '...' : 'not provided',
    username: username || 'not provided',
    displayName: displayName || 'not provided',
    email: email ? '***@' + email.split('@')[1] : 'not provided',
    healthGoals: healthGoals?.length || 0,
    musicPreferences: musicPreferences?.length || 0,
    dailyListeningGoal: dailyListeningGoal !== undefined ? dailyListeningGoal : 'not provided',
    timezone: timezone || 'not provided'
  });

  /**
   * Validate required parameters
   *
   * User ID is required to identify which user record to update.
   * Without it, we cannot perform the update operation safely.
   */
  if (!id) {
    console.log('🚨 Users API: Missing required user ID');
    return res.status(400).json({
      error: 'User ID is required',
      details: 'Provide user ID in request body to update user',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🔄 Users API: Updating user in database...');

    // Build update data object dynamically
    const updateData = {
      updatedAt: new Date() // Always update timestamp
    };

    // Add fields to updateData if they were provided
    if (firebaseUid !== undefined) updateData.firebaseUid = firebaseUid;
    if (username !== undefined) updateData.username = username;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (healthGoals !== undefined) updateData.healthGoals = healthGoals;
    if (musicPreferences !== undefined) updateData.musicPreferences = musicPreferences;
    if (dailyListeningGoal !== undefined) updateData.dailyListeningGoal = dailyListeningGoal;
    if (timezone !== undefined) updateData.timezone = timezone;

    console.log('🔄 Users API: Update data object:', updateData);

    /**
     * Check username uniqueness if username is being updated
     */
    if (username !== undefined) {
      console.log('🔍 Users API: Checking username availability...');
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { username }
      });

      // If username is taken by a different user, return error
      if (existingUserWithUsername && existingUserWithUsername.id !== id) {
        console.log('🚨 Users API: Username already taken by another user');
        return res.status(409).json({
          error: 'Username already taken',
          details: 'Please choose a different username',
          timestamp: new Date().toISOString()
        });
      }
    }

    /**
     * Update user record in database
     *
     * IMPORTANT: Use transaction to ensure we get fresh data
     * This is especially important on Vercel with serverless functions
     */
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Perform the update
      await tx.user.update({
        where: { id },
        data: updateData,
      });
      
      // Then fetch fresh data
      return await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firebaseUid: true,
          username: true,
          displayName: true,
          emailVerified: true,
          healthGoals: true,
          musicPreferences: true,
          dailyListeningGoal: true,
          timezone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    console.log('✅ Users API: User updated successfully');
    console.log('✅ Updated username in response:', updatedUser.username);
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Users API: Error updating user:', error);

    /**
     * Handle specific Prisma errors
     *
     * P2025: Record not found - user with provided ID doesn't exist
     * P2002: Unique constraint violation - duplicate field
     */
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user exists with the provided ID',
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      const fieldMessages = {
        'firebaseUid': {
          error: 'Firebase account already linked',
          details: 'Another user is already linked to this Firebase account'
        },
        'username': {
          error: 'Username already taken',
          details: 'Please choose a different username'
        },
        'email': {
          error: 'Email already registered',
          details: 'This email is already associated with an account'
        }
      };
      
      const message = fieldMessages[field] || {
        error: `${field} already in use`,
        details: `Another user is already using this ${field}`
      };
      
      return res.status(409).json({
        error: message.error,
        details: message.details,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to update user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST Request Handler - Create New User
 *
 * Creates a new user account in the database with health and wellness profile.
 * This endpoint is typically called after Firebase authentication to create
 * the corresponding database record with user preferences.
 *
 * @async
 * @function createUser
 * @param {Object} req - Express request object
 * @param {string} req.body.email - User's email address (required)
 * @param {string} req.body.username - Unique username (optional)
 * @param {string} req.body.displayName - User's display name (optional)
 * @param {string[]} req.body.healthGoals - Array of health goals (optional)
 * @param {string[]} req.body.musicPreferences - Array of music preferences (optional)
 * @param {number} req.body.dailyListeningGoal - Daily listening goal in minutes (optional)
 * @param {string} req.body.timezone - User's timezone (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created user data
 *
 * @throws {Error} 201 - User created successfully
 * @throws {Error} 200 - User already exists (idempotent behavior)
 * @throws {Error} 400 - Invalid request data or username taken
 * @throws {Error} 409 - Duplicate email or username
 * @throws {Error} 500 - Database or server error
 *
 * @example
 * POST /api/users
 * {
 *   "email": "user@example.com",
 *   "username": "musiclover123",
 *   "displayName": "John Doe",
 *   "healthGoals": ["stress_relief", "sleep_improvement"],
 *   "musicPreferences": ["classical", "ambient"],
 *   "dailyListeningGoal": 30,
 *   "timezone": "America/New_York"
 * }
 */
async function createUser(req, res) {
  console.log('➕ Users API: POST request received - Creating new user');

  // Extract user data from request body
  const {
    email,
    username,
    displayName,
    healthGoals,
    musicPreferences,
    dailyListeningGoal,
    timezone
  } = req.body;

  console.log('➕ Users API: User data -', {
    email: email ? '***@' + email.split('@')[1] : 'not provided',
    username: username || 'not provided',
    displayName: displayName || 'not provided',
    healthGoals: healthGoals?.length || 0,
    musicPreferences: musicPreferences?.length || 0,
    dailyListeningGoal: dailyListeningGoal || 'not set',
    timezone: timezone || 'not provided'
  });

  /**
   * Validate required fields
   *
   * Email is the minimum required field for user creation as it serves
   * as the primary identifier and is needed for authentication integration.
   */
  if (!email) {
    console.log('🚨 Users API: Missing required email field');
    return res.status(400).json({
      error: 'Email is required',
      details: 'Email address must be provided to create user account',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Check for existing user by email (idempotent behavior)
     *
     * If user already exists, return the existing user instead of creating
     * a duplicate. This prevents errors during registration flows where
     * the request might be sent multiple times.
     */
    console.log('🔍 Users API: Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        username: true,
        displayName: true,
        emailVerified: true,
        healthGoals: true,
        musicPreferences: true,
        dailyListeningGoal: true,
        timezone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (existingUser) {
      console.log('ℹ️ Users API: User already exists, returning existing user');
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Validate username uniqueness (if provided)
     *
     * Usernames must be unique across the platform. We check this
     * separately to provide a specific error message for username conflicts.
     */
    if (username) {
      console.log('🔍 Users API: Checking username availability...');
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        console.log('🚨 Users API: Username already taken');
        return res.status(400).json({
          error: 'Username already taken',
          details: 'Please choose a different username',
          timestamp: new Date().toISOString()
        });
      }
    }

    /**
     * Create new user record
     *
     * Creates a comprehensive user profile with health and wellness preferences.
     * All optional fields default to null or empty arrays as appropriate.
     */
    console.log('➕ Users API: Creating new user in database...');
    const user = await prisma.user.create({
      data: {
        email,
        username: username || null,
        displayName: displayName || null,
        emailVerified: false, // Will be updated when Firebase email is verified
        healthGoals: healthGoals || [], // Array of health goal strings
        musicPreferences: musicPreferences || [], // Array of music genre strings
        dailyListeningGoal: dailyListeningGoal || null, // Minutes per day
        timezone: timezone || null // User's timezone for scheduling
      },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        username: true,
        displayName: true,
        emailVerified: true,
        healthGoals: true,
        musicPreferences: true,
        dailyListeningGoal: true,
        timezone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ Users API: User created successfully');
    return res.status(201).json({
      message: 'User created successfully',
      user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Users API: Error creating user:', error);

    /**
     * Handle specific Prisma errors
     *
     * P2002: Unique constraint violation (email or username already exists)
     * This shouldn't happen due to our pre-checks, but provides a safety net.
     */
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(409).json({
        error: `${field} already exists`,
        details: `A user with this ${field} already exists in the system`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to create user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API handler for user operations
 *
 * Clean, focused router that delegates to specialized handler functions.
 * Handles CORS, validation, and routes requests to appropriate handlers:
 * - getUserData() for GET requests
 * - updateUser() for PATCH requests
 * - createUser() for POST requests
 * - Built-in health check and error handling
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, PATCH, OPTIONS)
 * @param {Object} req.query - URL query parameters
 * @param {Object} req.body - Request body data
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with user data or error message
 *
 * @throws {Error} 405 - Method not allowed
 * @throws {Error} 500 - Database connection errors
 *
 * @example
 * // Health check
 * GET /api/users?test=true
 *
 * @example
 * // Get user data
 * GET /api/users?email=user@example.com
 *
 * @example
 * // Create new user
 * POST /api/users { "email": "user@example.com" }
 *
 * @example
 * // Update user
 * PATCH /api/users { "id": "user-123", "firebaseUid": "firebase-456" }
 */
export default async function handler(req, res) {
  /**
   * Quick health check endpoint
   *
   * Bypasses full initialization for faster response.
   * Used by monitoring systems and deployment health checks.
   */
  if (req.method === 'GET' && req.query.test === 'true') {
    console.log('🔍 Users API: Health check requested');
    return res.status(200).json({
      message: 'Users API is working',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
  }

  /**
   * Set CORS headers for cross-origin requests
   *
   * Allows frontend applications running on different ports/domains
   * to access this API endpoint. Essential for development environment
   * where Vite (port 5173) needs to communicate with Express (port 3000).
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ensure consistent JSON response format
  res.setHeader('Content-Type', 'application/json');

  /**
   * Handle CORS preflight requests
   *
   * Browsers send OPTIONS requests before actual requests to check
   * if the cross-origin request is allowed. We respond with 200 OK
   * to indicate the request is permitted.
   */
  if (req.method === 'OPTIONS') {
    console.log('🔍 Users API: CORS preflight request handled');
    return res.status(200).end();
  }

  try {
    /**
     * Validate database configuration
     *
     * Ensures DATABASE_URL environment variable is set before attempting
     * any database operations. This prevents cryptic connection errors.
     */
    if (!process.env.DATABASE_URL) {
      console.error('🚨 Users API: Database not configured - DATABASE_URL is missing');
      return res.status(500).json({
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Enhanced health check with database connectivity test
     *
     * Tests both API responsiveness and database connection.
     * Used by monitoring systems and deployment health checks.
     */
    if (req.query.test === 'true') {
      try {
        console.log('🔍 Users API: Testing database connection...');

        // Attempt to connect to database
        await prisma.$connect();

        console.log('✅ Users API: Database connection successful');
        return res.status(200).json({
          message: 'Users API is working',
          timestamp: new Date().toISOString(),
          database: 'Connected to PostgreSQL via Prisma',
          status: 'healthy'
        });
      } catch (error) {
        console.error('🚨 Users API: Database connection failed:', error);
        return res.status(500).json({
          error: 'Failed to connect to database',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    /**
     * Route requests to specialized handler functions
     *
     * Each HTTP method is handled by a dedicated function for better
     * code organization, testing, and maintenance.
     */
    if (req.method === 'GET') {
      return await getUserData(req, res);
    }

    if (req.method === 'PATCH') {
      return await updateUser(req, res);
    }

    if (req.method === 'POST') {
      return await createUser(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Returns 405 Method Not Allowed for any HTTP methods not explicitly
     * handled above (DELETE, PUT, etc.). This provides clear feedback
     * about which operations are supported by this endpoint.
     */
    console.log('🚨 Users API: Unsupported method -', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      details: `${req.method} method is not supported. Use GET, POST, or PATCH.`,
      supportedMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    /**
     * Global error handler
     *
     * Catches any unhandled errors that occur during request processing.
     * This serves as a safety net to ensure the API always returns a
     * proper JSON response even when unexpected errors occur.
     */
    console.error('� Users API: Unhandled error:', error);
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
 * The 1MB limit is sufficient for user profile data while preventing abuse.
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
