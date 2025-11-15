/**
 * @fileoverview Mock People Management API Endpoint
 * Development-only API for testing people operations without database dependency.
 * Provides in-memory CRUD operations for people records during local development.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires None (Pure in-memory mock implementation)
 *
 * @description
 * This mock API provides a lightweight alternative to the real people.js API for development
 * and testing purposes. It maintains an in-memory array of people records and supports
 * all the same operations as the production API without requiring database connectivity.
 *
 * Key Features:
 * - In-memory storage with auto-incrementing IDs
 * - Sample data population for testing
 * - Individual person creation and management
 * - Bulk operations (populate, clear all)
 * - Full CORS support for frontend integration
 * - Comprehensive error handling and validation
 *
 * @example
 * // Health check
 * GET /api/mock-people?test=true
 *
 * // Get all people
 * GET /api/mock-people
 *
 * // Populate with sample data
 * POST /api/mock-people { "action": "populate" }
 *
 * // Create individual person
 * POST /api/mock-people { "firstName": "John", "lastName": "Doe" }
 *
 * // Clear all people
 * DELETE /api/mock-people
 */

/**
 * In-memory storage for people records during development
 * @type {Array<Object>} Array of people objects with id, firstName, lastName
 */
let mockPeople = [];

/**
 * Auto-incrementing ID counter for new people records
 * @type {number} Next available ID for person creation
 */
let nextId = 1;

/**
 * Handles GET requests to retrieve all people records from mock storage
 *
 * @async
 * @function getPeople
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with people array
 *
 * @description
 * Retrieves all people from the in-memory mock storage and returns them
 * sorted by ID in ascending order. This simulates the database query
 * behavior of the production API.
 *
 * @example
 * // Request
 * GET /api/mock-people
 *
 * // Response
 * {
 *   "people": [
 *     { "id": 1, "firstName": "John", "lastName": "Doe" },
 *     { "id": 2, "firstName": "Jane", "lastName": "Smith" }
 *   ]
 * }
 *
 * @throws {500} Internal server error if operation fails
 */
async function getPeople(req, res) {
  try {
    console.log('👥 Mock People API: GET request received');
    console.log(`👥 Mock People API: Retrieving ${mockPeople.length} people from mock storage`);

    // Sort people by ID for consistent ordering (simulates database ORDER BY)
    const sortedPeople = mockPeople.sort((a, b) => a.id - b.id);

    console.log(`✅ Mock People API: Successfully retrieved ${sortedPeople.length} people`);

    return res.status(200).json({
      people: sortedPeople,
      count: sortedPeople.length,
      message: 'People retrieved successfully from mock storage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock People API: Error in getPeople:', error);
    return res.status(500).json({
      error: 'Failed to retrieve people from mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles POST requests for creating people or populating sample data
 *
 * @async
 * @function createPerson
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing person data or action
 * @param {string} [req.body.action] - Special action ('populate' for sample data)
 * @param {string} [req.body.firstName] - Person's first name (required for individual creation)
 * @param {string} [req.body.lastName] - Person's last name (required for individual creation)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created person or populated data
 *
 * @description
 * Handles two types of POST operations:
 * 1. Bulk population with sample data (action: 'populate')
 * 2. Individual person creation (firstName, lastName required)
 *
 * For bulk population, clears existing data and creates 3 sample people.
 * For individual creation, validates required fields and creates a single person.
 *
 * @example
 * // Populate with sample data
 * POST /api/mock-people
 * { "action": "populate" }
 *
 * // Create individual person
 * POST /api/mock-people
 * { "firstName": "Alice", "lastName": "Wilson" }
 *
 * @throws {400} Missing required fields for individual person creation
 * @throws {500} Internal server error if operation fails
 */
async function createPerson(req, res) {
  try {
    console.log('👥 Mock People API: POST request received');

    // Check if we're populating with sample data
    if (req.body.action === 'populate') {
      console.log('👥 Mock People API: Populating with sample data');

      // Sample data to populate (simulates database seeding)
      const samplePeople = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Johnson' }
      ];

      // Clear existing data first (for demo purposes)
      console.log(`👥 Mock People API: Clearing ${mockPeople.length} existing people`);
      mockPeople = [];
      nextId = 1;

      // Insert sample data with auto-incrementing IDs
      const createdPeople = samplePeople.map(person => ({
        id: nextId++,
        firstName: person.firstName,
        lastName: person.lastName,
        createdAt: new Date().toISOString()
      }));

      mockPeople = createdPeople;

      console.log(`✅ Mock People API: Successfully populated ${createdPeople.length} sample people`);

      return res.status(201).json({
        message: 'Mock database populated successfully',
        count: createdPeople.length,
        people: mockPeople,
        timestamp: new Date().toISOString()
      });
    }

    // Handle individual person creation
    const { firstName, lastName } = req.body;

    console.log(`👥 Mock People API: Creating person - ${firstName} ${lastName}`);

    // Validate required fields
    if (!firstName || !lastName) {
      console.log('🚨 Mock People API: Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields: firstName and lastName',
        received: { firstName: !!firstName, lastName: !!lastName },
        timestamp: new Date().toISOString()
      });
    }

    // Create new person with auto-incrementing ID
    const person = {
      id: nextId++,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdAt: new Date().toISOString()
    };

    // Add to mock storage
    mockPeople.push(person);

    console.log(`✅ Mock People API: Successfully created person with ID ${person.id}`);

    return res.status(201).json({
      person,
      message: 'Person created successfully in mock storage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock People API: Error in createPerson:', error);
    return res.status(500).json({
      error: 'Failed to create person in mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles DELETE requests to clear all people from mock storage
 *
 * @async
 * @function deletePeople
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with deletion confirmation
 *
 * @description
 * Clears all people from the in-memory mock storage and resets the ID counter.
 * This simulates a bulk delete operation that would clear the database table.
 *
 * @example
 * // Clear all people
 * DELETE /api/mock-people
 *
 * // Response
 * {
 *   "message": "All people deleted successfully from mock storage",
 *   "deletedCount": 3,
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 *
 * @throws {500} Internal server error if operation fails
 */
async function deletePeople(req, res) {
  try {
    console.log('👥 Mock People API: DELETE request received');

    // Count people before deletion for reporting
    const deletedCount = mockPeople.length;
    console.log(`🗑️ Mock People API: Clearing ${deletedCount} people from mock storage`);

    // Clear all people from mock storage
    mockPeople = [];
    nextId = 1; // Reset ID counter

    console.log('✅ Mock People API: Successfully cleared all people from mock storage');

    return res.status(200).json({
      message: 'All people deleted successfully from mock storage',
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock People API: Error in deletePeople:', error);
    return res.status(500).json({
      error: 'Failed to delete people from mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main handler function for the Mock People API endpoint
 * Routes requests to appropriate handler functions based on HTTP method
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, DELETE, OPTIONS)
 * @param {Object} req.query - Query parameters
 * @param {Object} req.body - Request body for POST requests
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response from appropriate handler
 *
 * @description
 * Main entry point for the Mock People API. Handles CORS, method routing,
 * and provides a health check endpoint. Routes requests to specialized
 * handler functions based on HTTP method.
 *
 * Supported endpoints:
 * - GET: Retrieve all people (getPeople)
 * - POST: Create person or populate sample data (createPerson)
 * - DELETE: Clear all people (deletePeople)
 * - OPTIONS: CORS preflight handling
 * - Health check: ?test=true query parameter
 *
 * @example
 * // Health check
 * GET /api/mock-people?test=true
 *
 * // Get all people
 * GET /api/mock-people
 *
 * // Create person
 * POST /api/mock-people { "firstName": "John", "lastName": "Doe" }
 *
 * // Populate sample data
 * POST /api/mock-people { "action": "populate" }
 *
 * // Clear all people
 * DELETE /api/mock-people
 *
 * @throws {405} Method not allowed for unsupported HTTP methods
 * @throws {500} Internal server error for unexpected failures
 */
export default async function handler(req, res) {
  // Enable CORS for cross-origin requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    console.log('👥 Mock People API: CORS preflight request handled');
    return res.status(200).end();
  }

  // Ensure we always return JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log(`👥 Mock People API: Request received - ${req.method}`);

    // Health check endpoint for API monitoring
    if (req.query.test === 'true') {
      console.log('👥 Mock People API: Health check requested');
      return res.status(200).json({
        message: 'Mock People API is working',
        timestamp: new Date().toISOString(),
        hasDatabase: false,
        nodeVersion: process.version,
        databaseConnected: false,
        mode: 'mock',
        currentPeopleCount: mockPeople.length,
        nextId: nextId,
        supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS']
      });
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
      case 'GET':
        return await getPeople(req, res);

      case 'POST':
        return await createPerson(req, res);

      case 'DELETE':
        return await deletePeople(req, res);

      default:
        // Method not allowed
        console.log(`🚨 Mock People API: Unsupported method - ${req.method}`);
        return res.status(405).json({
          error: 'Method not allowed',
          details: `${req.method} method is not supported. Use GET, POST, or DELETE.`,
          supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('🚨 Mock People API: Unexpected error in main handler:', error);
    return res.status(500).json({
      error: 'Internal server error in mock people API',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * API Configuration for Mock People endpoint
 * @type {Object}
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Smaller limit for mock API
    },
  },
};
