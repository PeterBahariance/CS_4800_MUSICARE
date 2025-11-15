/**
 * @fileoverview Simple API Endpoint
 * Minimal testing endpoint for basic API functionality verification.
 * Provides the simplest possible API response for quick connectivity testing.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires None (Minimal standalone endpoint)
 *
 * @description
 * This simple API provides the most basic endpoint possible for testing API
 * connectivity and basic functionality. It's designed to be lightweight and
 * fast, making it ideal for quick health checks and basic connectivity tests.
 *
 * Key Features:
 * - Minimal response payload for fast testing
 * - Request method detection and reporting
 * - Timestamp generation for basic tracking
 * - Full CORS support for frontend integration
 * - No database dependencies or complex logic
 * - Works with all HTTP methods
 * - Synchronous operation for maximum speed
 *
 * @example
 * // Basic connectivity test
 * GET /api/simple
 *
 * // Response
 * {
 *   "message": "Simple API working",
 *   "method": "GET",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "status": "ok"
 * }
 */

/**
 * Main handler function for the Simple API endpoint
 * Provides minimal API response for basic connectivity testing
 *
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method used for the request
 * @param {Object} res - Express response object
 * @returns {void} JSON response with basic status information
 *
 * @description
 * Ultra-simple endpoint that returns basic API status with minimal processing.
 * Designed for quick connectivity tests, monitoring, and basic functionality
 * verification. Uses synchronous operations for maximum speed.
 *
 * Response includes:
 * - Simple confirmation message
 * - HTTP method used for the request
 * - Current timestamp
 * - Basic status indicator
 *
 * @example
 * // Quick connectivity test
 * GET /api/simple
 *
 * // Test with different methods
 * POST /api/simple
 * PUT /api/simple
 * DELETE /api/simple
 *
 * // Response format (all methods)
 * {
 *   "message": "Simple API working",
 *   "method": "GET",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "status": "ok"
 * }
 */
export default function handler(req, res) {
  // Enable CORS for cross-origin requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    console.log('⚡ Simple API: CORS preflight request handled');
    return res.status(200).end();
  }

  console.log(`⚡ Simple API: Request received - ${req.method}`);

  // Return minimal response for maximum speed
  const response = {
    message: 'Simple API working',
    method: req.method,
    timestamp: new Date().toISOString(),
    status: 'ok'
  };

  console.log(`✅ Simple API: Successfully processed ${req.method} request`);

  return res.status(200).json(response);
}

/**
 * API Configuration for Simple endpoint
 * @type {Object}
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb', // Very small limit for simple endpoint
    },
  },
};
