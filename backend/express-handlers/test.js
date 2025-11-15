/**
 * @fileoverview Test API Endpoint
 * Simple testing endpoint for verifying API functionality and environment status.
 * Provides basic health check and environment information for development and debugging.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires None (Standalone test endpoint)
 *
 * @description
 * This test API provides a simple endpoint for verifying that the API infrastructure
 * is working correctly. It returns basic environment information and can be used
 * for health checks, monitoring, and debugging purposes.
 *
 * Key Features:
 * - Environment status reporting (NODE_ENV, database connectivity)
 * - Request method detection and reporting
 * - Timestamp generation for request tracking
 * - Full CORS support for frontend integration
 * - Comprehensive error handling
 * - Works with all HTTP methods
 *
 * @example
 * // Basic test
 * GET /api/test
 *
 * // Response
 * {
 *   "message": "Test API is working",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "method": "GET",
 *   "hasDatabase": true,
 *   "nodeEnv": "development"
 * }
 */

/**
 * Main handler function for the Test API endpoint
 * Provides basic health check and environment information
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method used for the request
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with test information
 *
 * @description
 * Simple test endpoint that returns basic API status and environment information.
 * Accepts all HTTP methods and provides consistent response format for testing
 * and monitoring purposes.
 *
 * Response includes:
 * - Confirmation message that API is working
 * - Current timestamp for request tracking
 * - HTTP method used for the request
 * - Database connectivity status
 * - Node.js environment (development, production, etc.)
 * - Node.js version information
 * - Process uptime for monitoring
 *
 * @example
 * // Test with GET
 * GET /api/test
 *
 * // Test with POST
 * POST /api/test
 *
 * // Response format
 * {
 *   "message": "Test API is working",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "method": "GET",
 *   "hasDatabase": true,
 *   "nodeEnv": "development",
 *   "nodeVersion": "v18.17.0",
 *   "uptime": 12345.67
 * }
 *
 * @throws {500} Internal server error if unexpected failure occurs
 */
export default async function handler(req, res) {
  // Enable CORS for cross-origin requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    console.log('🧪 Test API: CORS preflight request handled');
    return res.status(200).end();
  }

  try {
    console.log(`🧪 Test API: Request received - ${req.method}`);

    // Gather environment and system information
    const response = {
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch,
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    console.log(`✅ Test API: Successfully processed ${req.method} request`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('🚨 Test API: Unexpected error:', error);
    return res.status(500).json({
      error: 'Test API error',
      message: error.message,
      timestamp: new Date().toISOString(),
      method: req.method
    });
  }
}

/**
 * API Configuration for Test endpoint
 * @type {Object}
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Small limit for test endpoint
    },
  },
};
