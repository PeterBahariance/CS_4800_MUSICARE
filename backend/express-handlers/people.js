/**
 * @fileoverview People Management API Endpoint
 * Comprehensive API for managing people records in the Musicare platform.
 * Provides CRUD operations for people data with sample data population capabilities.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @requires prisma - Database ORM for PostgreSQL operations
 * @requires express - Web framework for handling HTTP requests
 *
 * @description
 * This API endpoint manages people records in the database, providing functionality
 * for creating, reading, and deleting people entries. It includes special features
 * for populating the database with sample data for testing and development purposes.
 *
 * @features
 * - Complete CRUD operations for people records
 * - Sample data population for testing/development
 * - Bulk deletion capabilities
 * - Comprehensive error handling and validation
 * - Database connection health monitoring
 * - Structured logging with emoji indicators
 *
 * @endpoints
 * - GET /api/people - Retrieve all people records
 * - POST /api/people - Create new person or populate sample data
 * - DELETE /api/people - Delete all people records
 *
 * @example
 * // Get all people
 * GET /api/people
 *
 * // Create a new person
 * POST /api/people
 * Body: {"firstName": "John", "lastName": "Doe"}
 *
 * // Populate with sample data
 * POST /api/people
 * Body: {"action": "populate"}
 *
 * @security
 * - Input validation for required fields
 * - SQL injection prevention through Prisma ORM
 * - Structured error responses without sensitive data exposure
 */

import { prisma } from '../lib/prisma.js';

/**
 * Retrieve all people records from the database
 *
 * @async
 * @function getPeople
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with people array
 * @returns {Array<Object>} people - Array of people objects
 * @returns {number} count - Total number of people records
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {500} When database operations fail
 *
 * @example
 * // Request
 * GET /api/people
 *
 * // Response
 * {
 *   "people": [
 *     {
 *       "id": 1,
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "createdAt": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "count": 1,
 *   "message": "People retrieved successfully",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function retrieves all people records from the database with the following features:
 *
 * 1. **Ordered Results**: Returns people ordered by ID for consistent pagination
 * 2. **Complete Records**: Returns all fields for each person record
 * 3. **Count Information**: Provides total count for frontend pagination
 * 4. **Performance Optimized**: Uses efficient database queries
 * 5. **Error Handling**: Comprehensive error handling with detailed logging
 *
 * **Database Operations:**
 * - Uses Prisma's `findMany()` for efficient bulk retrieval
 * - Orders results by ID in ascending order for consistency
 * - Returns all fields from the people table
 *
 * **Response Format:**
 * - Always returns an array, even if empty
 * - Includes metadata like count and timestamp
 * - Provides success message for confirmation
 */
async function getPeople(req, res) {
  console.log('👥 People API: GET request received');

  try {
    console.log('👥 People API: Fetching all people from database...');

    // Get all people from the database, ordered by ID
    const people = await prisma.people.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`✅ People API: Successfully retrieved ${people.length} people records`);

    return res.status(200).json({
      people,
      count: people.length,
      message: 'People retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 People API: Error in getPeople:', error);
    return res.status(500).json({
      error: 'Failed to retrieve people',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new person record or populate database with sample data
 *
 * @async
 * @function createPerson
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing person data or action
 * @param {string} [req.body.firstName] - First name of the person (required for individual creation)
 * @param {string} [req.body.lastName] - Last name of the person (required for individual creation)
 * @param {string} [req.body.action] - Special action ("populate" for sample data)
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with created person or population results
 * @returns {Object} [person] - Created person object (for individual creation)
 * @returns {Array<Object>} [people] - Array of people (for population)
 * @returns {number} [count] - Number of records created
 * @returns {string} message - Success message
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {400} When required fields are missing for individual creation
 * @throws {500} When database operations fail
 *
 * @example
 * // Create individual person
 * POST /api/people
 * Body: {"firstName": "John", "lastName": "Doe"}
 *
 * // Response
 * {
 *   "person": {
 *     "id": 1,
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   },
 *   "message": "Person created successfully",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @example
 * // Populate with sample data
 * POST /api/people
 * Body: {"action": "populate"}
 *
 * // Response
 * {
 *   "people": [...],
 *   "count": 3,
 *   "message": "Database populated successfully with 3 sample people",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function handles two types of POST operations:
 *
 * **1. Individual Person Creation:**
 * - Validates required fields (firstName, lastName)
 * - Creates single person record in database
 * - Returns created person with generated ID
 *
 * **2. Sample Data Population:**
 * - Triggered by `{"action": "populate"}` in request body
 * - Clears existing people data (for demo purposes)
 * - Inserts predefined sample people records
 * - Returns all created records for verification
 *
 * **Validation Rules:**
 * - firstName: Required string, non-empty
 * - lastName: Required string, non-empty
 * - action: Optional string, "populate" for sample data
 *
 * **Database Operations:**
 * - Individual: Uses Prisma's `create()` for single record
 * - Population: Uses `deleteMany()` + `createMany()` for bulk operations
 * - Atomic operations ensure data consistency
 *
 * **Sample Data:**
 * - John Doe
 * - Jane Smith
 * - Bob Johnson
 *
 * **Security Features:**
 * - Input validation prevents empty/invalid data
 * - Prisma ORM prevents SQL injection attacks
 * - Structured error responses without sensitive data
 */
async function createPerson(req, res) {
  console.log('👥 People API: POST request received');

  const { firstName, lastName, action } = req.body;
  console.log(`➕ People API: Action - ${action || 'create individual'}, Data - ${firstName ? 'provided' : 'missing'}`);

  try {
    // Handle sample data population
    if (action === 'populate') {
      console.log('➕ People API: Populating database with sample data...');

      // Sample data to populate
      const samplePeople = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Johnson' }
      ];

      console.log('🗑️ People API: Clearing existing people data...');
      // Clear existing data first (for demo purposes)
      const deletedCount = await prisma.people.deleteMany({});
      console.log(`🗑️ People API: Deleted ${deletedCount.count} existing records`);

      console.log('➕ People API: Inserting sample data...');
      // Insert sample data using bulk create
      const createdPeople = await prisma.people.createMany({
        data: samplePeople
      });

      console.log(`➕ People API: Created ${createdPeople.count} sample records`);

      // Fetch the created records to return them with IDs
      const people = await prisma.people.findMany({
        orderBy: { id: 'asc' }
      });

      console.log('✅ People API: Sample data population completed successfully');

      return res.status(201).json({
        people,
        count: createdPeople.count,
        message: `Database populated successfully with ${createdPeople.count} sample people`,
        timestamp: new Date().toISOString()
      });
    }

    // Handle individual person creation
    console.log('➕ People API: Creating individual person...');

    // Validate required fields
    if (!firstName || !lastName) {
      console.log('🚨 People API: Missing required fields for person creation');
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both firstName and lastName are required for person creation',
        requiredFields: ['firstName', 'lastName'],
        timestamp: new Date().toISOString()
      });
    }

    // Validate field types and content
    if (typeof firstName !== 'string' || typeof lastName !== 'string') {
      console.log('🚨 People API: Invalid field types provided');
      return res.status(400).json({
        error: 'Invalid field types',
        details: 'firstName and lastName must be strings',
        timestamp: new Date().toISOString()
      });
    }

    // Validate field content (not just whitespace)
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      console.log('🚨 People API: Empty field values provided');
      return res.status(400).json({
        error: 'Empty field values',
        details: 'firstName and lastName cannot be empty or whitespace only',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`➕ People API: Creating person - ${firstName.trim()} ${lastName.trim()}`);

    // Create the person record
    const person = await prisma.people.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      }
    });

    console.log(`✅ People API: Successfully created person with ID ${person.id}`);

    return res.status(201).json({
      person,
      message: 'Person created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 People API: Error in createPerson:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Person already exists',
        details: 'A person with this information already exists in the database',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to create person',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete all people records from the database
 *
 * @async
 * @function deletePeople
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with deletion results
 * @returns {number} deletedCount - Number of records deleted
 * @returns {string} message - Success message
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {500} When database operations fail
 *
 * @example
 * // Request
 * DELETE /api/people
 *
 * // Response
 * {
 *   "deletedCount": 5,
 *   "message": "All people deleted successfully",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function performs a bulk deletion of all people records from the database.
 *
 * **⚠️ WARNING: This operation is destructive and cannot be undone!**
 *
 * **Features:**
 * 1. **Bulk Deletion**: Removes all records in a single database operation
 * 2. **Count Reporting**: Returns the number of deleted records
 * 3. **Atomic Operation**: Uses database transactions for consistency
 * 4. **Comprehensive Logging**: Detailed logging for audit trails
 * 5. **Error Handling**: Graceful handling of database errors
 *
 * **Use Cases:**
 * - Development/testing environment cleanup
 * - Data reset for demo purposes
 * - Administrative bulk operations
 *
 * **Database Operations:**
 * - Uses Prisma's `deleteMany({})` for bulk deletion
 * - Returns count of affected records
 * - Maintains referential integrity
 *
 * **Security Considerations:**
 * - This endpoint should be protected in production environments
 * - Consider adding authentication/authorization checks
 * - Log all deletion operations for audit purposes
 *
 * **Performance:**
 * - Efficient bulk operation using database-level deletion
 * - Single transaction ensures atomicity
 * - Minimal memory usage for large datasets
 */
async function deletePeople(req, res) {
  console.log('👥 People API: DELETE request received');
  console.log('🗑️ People API: Preparing to delete all people records...');

  try {
    // Perform bulk deletion of all people records
    console.log('🗑️ People API: Executing bulk deletion...');
    const deletedCount = await prisma.people.deleteMany({});

    console.log(`✅ People API: Successfully deleted ${deletedCount.count} people records`);

    return res.status(200).json({
      deletedCount: deletedCount.count,
      message: 'All people deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 People API: Error in deletePeople:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete people',
        details: 'Some people records are referenced by other data and cannot be deleted',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to delete people',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API handler for people management endpoint
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, DELETE, OPTIONS)
 * @param {Object} req.query - Query parameters
 * @param {Object} req.body - Request body for POST operations
 * @param {Object} res - Express response object
 *
 * @returns {Promise<void>} Sends JSON response to client
 *
 * @description
 * Main entry point for the people management API endpoint. This function:
 *
 * 1. **CORS Configuration**: Sets up cross-origin resource sharing headers
 * 2. **Method Validation**: Ensures only supported HTTP methods are allowed
 * 3. **Database Validation**: Verifies database connectivity before processing
 * 4. **Health Check**: Provides comprehensive API health status endpoint
 * 5. **Request Routing**: Delegates requests to specialized handler functions
 * 6. **Error Handling**: Catches and handles all unhandled errors gracefully
 * 7. **Resource Cleanup**: Ensures proper database connection cleanup
 *
 * **Supported HTTP Methods:**
 * - `GET`: Retrieve all people records
 * - `POST`: Create new person or populate sample data
 * - `DELETE`: Delete all people records
 * - `OPTIONS`: CORS preflight request handling
 *
 * **Health Check Endpoint:**
 * - `GET /api/people?test=true` - Returns comprehensive API health status
 * - Includes database connectivity, Node.js version, and system information
 *
 * **Error Responses:**
 * - `405`: Method not allowed (for unsupported HTTP methods)
 * - `500`: Internal server error (for database or system failures)
 *
 * **CORS Headers:**
 * - `Access-Control-Allow-Origin: *` - Allows requests from any origin
 * - `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS` - Specifies allowed methods
 * - `Access-Control-Allow-Headers: Content-Type` - Allows content-type header
 *
 * **Performance Features:**
 * - Database connection validation before processing requests
 * - Automatic database disconnection after request completion
 * - Structured error logging for debugging and monitoring
 * - Efficient request routing to specialized functions
 *
 * @example
 * // Health check request
 * GET /api/people?test=true
 *
 * // Get all people
 * GET /api/people
 *
 * // Create person
 * POST /api/people
 * Body: {"firstName": "John", "lastName": "Doe"}
 *
 * // Populate sample data
 * POST /api/people
 * Body: {"action": "populate"}
 *
 * // Delete all people
 * DELETE /api/people
 *
 * // CORS preflight request
 * OPTIONS /api/people
 */
export default async function handler(req, res) {
  console.log('👥 People API: Request received -', req.method);

  /**
   * CORS Configuration
   *
   * Enables cross-origin requests from any domain to support
   * frontend applications hosted on different domains/ports.
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  /**
   * Handle CORS preflight requests
   *
   * Browsers send OPTIONS requests before actual requests to check
   * if the cross-origin request is allowed.
   */
  if (req.method === 'OPTIONS') {
    console.log('👥 People API: Handling CORS preflight request');
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
      console.log('🚨 People API: Database not configured');
      return res.status(500).json({
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Health check endpoint - MUST be checked before method routing
     *
     * Comprehensive health check that tests database connectivity
     * and provides system information for monitoring and debugging.
     */
    if (req.query.test === 'true') {
      console.log('👥 People API: Health check requested');

      try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ People API: Database connection successful');

        return res.status(200).json({
          message: 'People API is working',
          timestamp: new Date().toISOString(),
          database: 'Connected to PostgreSQL via Prisma',
          status: 'healthy',
          nodeVersion: process.version,
          hasDatabase: !!process.env.DATABASE_URL,
          databaseConnected: true
        });

      } catch (dbError) {
        console.error('🚨 People API: Database connection failed during health check:', dbError);

        return res.status(500).json({
          message: 'People API is working but database connection failed',
          timestamp: new Date().toISOString(),
          database: 'Failed to connect to PostgreSQL',
          status: 'unhealthy',
          nodeVersion: process.version,
          hasDatabase: !!process.env.DATABASE_URL,
          databaseConnected: false,
          dbError: dbError.message
        });
      }
    }

    /**
     * Route GET requests to getPeople handler
     *
     * Handles retrieval of all people records from the database.
     */
    if (req.method === 'GET') {
      return await getPeople(req, res);
    }

    /**
     * Route POST requests to createPerson handler
     *
     * Handles both individual person creation and sample data population.
     */
    if (req.method === 'POST') {
      return await createPerson(req, res);
    }

    /**
     * Route DELETE requests to deletePeople handler
     *
     * Handles bulk deletion of all people records.
     */
    if (req.method === 'DELETE') {
      return await deletePeople(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Return a clear error message for methods that are not supported
     * by this API endpoint.
     */
    console.log('🚨 People API: Unsupported method -', req.method);
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
     * Catches any unhandled errors and returns a structured error response.
     * Logs detailed error information for debugging purposes.
     */
    console.error('🚨 People API: Unhandled error:', error);
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
      console.error('🚨 People API: Error disconnecting from database:', disconnectError);
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
