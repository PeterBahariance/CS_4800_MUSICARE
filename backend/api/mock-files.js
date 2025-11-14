/**
 * @fileoverview Mock File Management API Endpoint
 * Development-only API for testing file operations without database dependency.
 * Provides in-memory CRUD operations for file records during local development.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires None (Pure in-memory mock implementation)
 *
 * @description
 * This mock API provides a lightweight alternative to the real files.js API for development
 * and testing purposes. It maintains an in-memory array of file records and supports
 * all the same operations as the production API without requiring database connectivity.
 *
 * Key Features:
 * - In-memory storage with auto-incrementing IDs
 * - Section-based file organization (documents, images, audio, videos, data, other)
 * - File size validation (5MB limit)
 * - Content type validation and Base64 storage
 * - Individual file deletion by ID
 * - Section filtering for file retrieval
 * - Full CORS support for frontend integration
 * - Comprehensive error handling and validation
 *
 * @example
 * // Health check
 * GET /api/mock-files?test=true
 *
 * // Get all files
 * GET /api/mock-files
 *
 * // Get files by section
 * GET /api/mock-files?section=documents
 *
 * // Upload file
 * POST /api/mock-files { "name": "test.txt", "type": "text/plain", "size": 100, "content": "base64...", "section": "documents" }
 *
 * // Delete file
 * DELETE /api/mock-files?id=1
 */

/**
 * In-memory storage for file records during development
 * @type {Array<Object>} Array of file objects with id, name, type, size, content, section, createdAt
 */
let mockFiles = [];

/**
 * Auto-incrementing ID counter for new file records
 * @type {number} Next available ID for file creation
 */
let nextId = 1;

/**
 * Handles GET requests to retrieve files from mock storage with optional section filtering
 *
 * @async
 * @function getFiles
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.section] - Optional section filter (documents, images, audio, videos, data, other)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with files array
 *
 * @description
 * Retrieves files from the in-memory mock storage with optional section filtering.
 * Files are sorted by creation date (newest first) to match production API behavior.
 *
 * @example
 * // Get all files
 * GET /api/mock-files
 *
 * // Get files by section
 * GET /api/mock-files?section=documents
 *
 * // Response
 * {
 *   "files": [
 *     { "id": 1, "name": "test.txt", "type": "text/plain", "size": 100, "section": "documents", "createdAt": "2024-01-15T10:30:00.000Z" }
 *   ],
 *   "count": 1,
 *   "section": "documents",
 *   "message": "Files retrieved successfully from mock storage",
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 *
 * @throws {500} Internal server error if operation fails
 */
async function getFiles(req, res) {
  try {
    console.log('📁 Mock Files API: GET request received');

    const { section } = req.query;

    if (section) {
      console.log(`📁 Mock Files API: Section filter - ${section}`);
    } else {
      console.log('📁 Mock Files API: Section filter - none (all files)');
    }

    // Filter by section if provided, otherwise return all files
    const files = section
      ? mockFiles.filter(file => file.section === section)
      : mockFiles;

    // Sort by creation date (newest first) to match production API
    const sortedFiles = files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`✅ Mock Files API: Successfully retrieved ${sortedFiles.length} files${section ? ` for section "${section}"` : ''}`);

    return res.status(200).json({
      files: sortedFiles,
      count: sortedFiles.length,
      section: section || null,
      message: `Files retrieved successfully from mock storage${section ? ` for section "${section}"` : ''}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock Files API: Error in getFiles:', error);
    return res.status(500).json({
      error: 'Failed to retrieve files from mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles POST requests for uploading files to mock storage
 *
 * @async
 * @function uploadFile
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing file data
 * @param {string} req.body.name - File name (required)
 * @param {string} req.body.type - MIME type (required)
 * @param {number} req.body.size - File size in bytes (required)
 * @param {string} req.body.content - Base64 encoded file content (required)
 * @param {string} req.body.section - File section/category (required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with uploaded file data
 *
 * @description
 * Handles file uploads to mock storage with comprehensive validation:
 * - Validates all required fields are present
 * - Enforces 5MB file size limit
 * - Validates section is one of the allowed values
 * - Stores file with auto-incrementing ID and timestamp
 *
 * @example
 * // Upload file
 * POST /api/mock-files
 * {
 *   "name": "document.pdf",
 *   "type": "application/pdf",
 *   "size": 1024000,
 *   "content": "JVBERi0xLjQKJcOkw7zDtsO...",
 *   "section": "documents"
 * }
 *
 * // Response
 * {
 *   "file": {
 *     "id": 1,
 *     "name": "document.pdf",
 *     "type": "application/pdf",
 *     "size": 1024000,
 *     "section": "documents",
 *     "createdAt": "2024-01-15T10:30:00.000Z"
 *   },
 *   "message": "File uploaded successfully to mock storage",
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 *
 * @throws {400} Missing required fields or validation errors
 * @throws {500} Internal server error if operation fails
 */
async function uploadFile(req, res) {
  try {
    console.log('📁 Mock Files API: POST request received');

    const { name, type, size, content, section } = req.body;

    console.log(`📁 Mock Files API: Upload request - Name: ${name}, Type: ${type}, Size: ${size} bytes, Section: ${section}`);

    // Validate required fields
    if (!name || !type || !content || !section) {
      console.log('🚨 Mock Files API: Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'name, type, content, and section are all required',
        received: {
          name: !!name,
          type: !!type,
          content: !!content,
          section: !!section
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (size > maxSize) {
      console.log(`🚨 Mock Files API: File too large - ${size} bytes (max: ${maxSize})`);
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB.',
        details: `File size: ${size} bytes, Maximum allowed: ${maxSize} bytes`,
        timestamp: new Date().toISOString()
      });
    }

    // Validate section (optional - could add section validation here)
    const allowedSections = ['documents', 'images', 'audio', 'videos', 'data', 'other'];
    if (!allowedSections.includes(section)) {
      console.log(`🚨 Mock Files API: Invalid section - ${section}`);
      return res.status(400).json({
        error: 'Invalid section',
        details: `Section must be one of: ${allowedSections.join(', ')}`,
        received: section,
        timestamp: new Date().toISOString()
      });
    }

    // Create file record with auto-incrementing ID
    const file = {
      id: nextId++,
      name: name.trim(),
      type: type.trim(),
      size: parseInt(size),
      content: content, // Store Base64 content as-is
      section: section.trim(),
      createdAt: new Date().toISOString()
    };

    // Add to mock storage
    mockFiles.push(file);

    console.log(`✅ Mock Files API: Successfully uploaded file with ID ${file.id}`);

    // Return file data without content for security/size reasons
    const { content: _, ...fileResponse } = file;

    return res.status(201).json({
      file: fileResponse,
      message: 'File uploaded successfully to mock storage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock Files API: Error in uploadFile:', error);
    return res.status(500).json({
      error: 'Failed to upload file to mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles DELETE requests to remove files from mock storage by ID
 *
 * @async
 * @function deleteFile
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.id - File ID to delete (required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with deletion confirmation
 *
 * @description
 * Deletes a specific file from mock storage by ID. Validates that the ID
 * is provided and that the file exists before attempting deletion.
 *
 * @example
 * // Delete file
 * DELETE /api/mock-files?id=1
 *
 * // Response
 * {
 *   "message": "File deleted successfully from mock storage",
 *   "deletedFileId": 1,
 *   "deletedFileName": "document.pdf",
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 *
 * @throws {400} Missing file ID
 * @throws {404} File not found
 * @throws {500} Internal server error if operation fails
 */
async function deleteFile(req, res) {
  try {
    console.log('📁 Mock Files API: DELETE request received');

    const { id } = req.query;

    console.log(`🗑️ Mock Files API: Delete request for file ID - ${id}`);

    // Validate ID is provided
    if (!id) {
      console.log('🚨 Mock Files API: Missing file ID');
      return res.status(400).json({
        error: 'File ID is required',
        details: 'Provide file ID as query parameter: ?id=123',
        timestamp: new Date().toISOString()
      });
    }

    // Find file in mock storage
    const fileIndex = mockFiles.findIndex(file => file.id === parseInt(id));
    if (fileIndex === -1) {
      console.log(`🚨 Mock Files API: File not found - ID ${id}`);
      return res.status(404).json({
        error: 'File not found',
        details: `No file found with ID: ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get file info before deletion for response
    const deletedFile = mockFiles[fileIndex];

    // Remove file from mock storage
    mockFiles.splice(fileIndex, 1);

    console.log(`✅ Mock Files API: Successfully deleted file "${deletedFile.name}" (ID: ${deletedFile.id})`);

    return res.status(200).json({
      message: 'File deleted successfully from mock storage',
      deletedFileId: deletedFile.id,
      deletedFileName: deletedFile.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Mock Files API: Error in deleteFile:', error);
    return res.status(500).json({
      error: 'Failed to delete file from mock storage',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main handler function for the Mock Files API endpoint
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
 * Main entry point for the Mock Files API. Handles CORS, method routing,
 * and provides a health check endpoint. Routes requests to specialized
 * handler functions based on HTTP method.
 *
 * Supported endpoints:
 * - GET: Retrieve files with optional section filtering (getFiles)
 * - POST: Upload new files (uploadFile)
 * - DELETE: Delete files by ID (deleteFile)
 * - OPTIONS: CORS preflight handling
 * - Health check: ?test=true query parameter
 *
 * @example
 * // Health check
 * GET /api/mock-files?test=true
 *
 * // Get all files
 * GET /api/mock-files
 *
 * // Get files by section
 * GET /api/mock-files?section=documents
 *
 * // Upload file
 * POST /api/mock-files { "name": "test.txt", "type": "text/plain", "size": 100, "content": "base64...", "section": "documents" }
 *
 * // Delete file
 * DELETE /api/mock-files?id=1
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
    console.log('📁 Mock Files API: CORS preflight request handled');
    return res.status(200).end();
  }

  // Ensure we always return JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log(`📁 Mock Files API: Request received - ${req.method}`);

    // Health check endpoint for API monitoring
    if (req.query.test === 'true') {
      console.log('📁 Mock Files API: Health check requested');
      return res.status(200).json({
        message: 'Mock Files API is working',
        timestamp: new Date().toISOString(),
        hasDatabase: false,
        nodeVersion: process.version,
        databaseConnected: false,
        mode: 'mock',
        currentFilesCount: mockFiles.length,
        nextId: nextId,
        supportedSections: ['documents', 'images', 'audio', 'videos', 'data', 'other'],
        maxFileSize: '5MB',
        supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS']
      });
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
      case 'GET':
        return await getFiles(req, res);

      case 'POST':
        return await uploadFile(req, res);

      case 'DELETE':
        return await deleteFile(req, res);

      default:
        // Method not allowed
        console.log(`🚨 Mock Files API: Unsupported method - ${req.method}`);
        return res.status(405).json({
          error: 'Method not allowed',
          details: `${req.method} method is not supported. Use GET, POST, or DELETE.`,
          supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('🚨 Mock Files API: Unexpected error in main handler:', error);
    return res.status(500).json({
      error: 'Internal server error in mock files API',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * API Configuration for Mock Files endpoint
 * @type {Object}
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Higher limit for file uploads
    },
  },
};
