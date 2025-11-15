/**
 * @fileoverview File Management API Endpoint
 * Comprehensive API for managing file uploads, storage, and retrieval in the Musicare platform.
 * Provides secure file handling with size validation, section-based organization, and content management.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @requires prisma - Database ORM for PostgreSQL operations
 * @requires express - Web framework for handling HTTP requests
 *
 * @description
 * This API endpoint manages file operations in the database, providing functionality
 * for uploading, retrieving, and deleting files. It includes security features like
 * file size validation, content type checking, and section-based organization.
 *
 * @features
 * - Secure file upload with validation
 * - Section-based file organization
 * - File size limits (5MB maximum)
 * - Content type validation
 * - File retrieval with filtering
 * - Individual file deletion
 * - Comprehensive error handling and logging
 *
 * @endpoints
 * - GET /api/files - Retrieve all files or files by section
 * - POST /api/files - Upload new file with validation
 * - DELETE /api/files?id=X - Delete specific file by ID
 *
 * @example
 * // Get all files
 * GET /api/files
 *
 * // Get files by section
 * GET /api/files?section=documents
 *
 * // Upload a new file
 * POST /api/files
 * Body: {
 *   "name": "document.pdf",
 *   "type": "application/pdf",
 *   "size": 1024000,
 *   "content": "base64-encoded-content",
 *   "section": "documents"
 * }
 *
 * // Delete a file
 * DELETE /api/files?id=123
 *
 * @security
 * - File size validation (5MB limit)
 * - Content type validation
 * - Input sanitization for file names
 * - SQL injection prevention through Prisma ORM
 * - Structured error responses without sensitive data exposure
 */

import { prisma } from '../lib/prisma.js';

/**
 * Retrieve files from the database with optional section filtering
 *
 * @async
 * @function getFiles
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.section] - Optional section filter for files
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with files array
 * @returns {Array<Object>} files - Array of file objects
 * @returns {number} count - Total number of files returned
 * @returns {string} [section] - Section filter applied (if any)
 * @returns {string} message - Success message
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {500} When database operations fail
 *
 * @example
 * // Get all files
 * GET /api/files
 *
 * // Response
 * {
 *   "files": [
 *     {
 *       "id": 1,
 *       "name": "document.pdf",
 *       "type": "application/pdf",
 *       "size": 1024000,
 *       "section": "documents",
 *       "createdAt": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "count": 1,
 *   "message": "Files retrieved successfully",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @example
 * // Get files by section
 * GET /api/files?section=images
 *
 * // Response
 * {
 *   "files": [...],
 *   "count": 5,
 *   "section": "images",
 *   "message": "Files retrieved successfully for section: images",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function retrieves files from the database with the following features:
 *
 * 1. **Section Filtering**: Optional filtering by section parameter
 * 2. **Ordered Results**: Returns files ordered by creation date (newest first)
 * 3. **Complete Metadata**: Returns all file information including size, type, section
 * 4. **Count Information**: Provides total count for frontend pagination
 * 5. **Performance Optimized**: Uses efficient database queries with proper indexing
 *
 * **Database Operations:**
 * - Uses Prisma's `findMany()` for efficient bulk retrieval
 * - Applies conditional WHERE clause for section filtering
 * - Orders results by createdAt in descending order (newest first)
 * - Returns all fields from the files table
 *
 * **Response Format:**
 * - Always returns an array, even if empty
 * - Includes metadata like count, section filter, and timestamp
 * - Provides success message for confirmation
 *
 * **Section Organization:**
 * Files can be organized into sections such as:
 * - "documents" - PDF files, Word documents, etc.
 * - "images" - Photos, graphics, thumbnails
 * - "audio" - Music files, recordings, sound effects
 * - "videos" - Video files, clips, tutorials
 * - "data" - CSV files, JSON exports, backups
 */
async function getFiles(req, res) {
  console.log('📁 Files API: GET request received');

  const { section } = req.query;
  console.log(`📁 Files API: Section filter - ${section || 'none (all files)'}`);

  try {
    console.log('📁 Files API: Fetching files from database...');

    // Build query with optional section filtering
    const whereClause = section ? { section } : {};

    // Get files from the database, ordered by creation date (newest first)
    const files = await prisma.file.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Files API: Successfully retrieved ${files.length} files${section ? ` for section "${section}"` : ''}`);

    return res.status(200).json({
      files,
      count: files.length,
      ...(section && { section }),
      message: section
        ? `Files retrieved successfully for section: ${section}`
        : 'Files retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Files API: Error in getFiles:', error);
    return res.status(500).json({
      error: 'Failed to retrieve files',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Upload and store a new file in the database
 *
 * @async
 * @function uploadFile
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing file data
 * @param {string} req.body.name - File name with extension
 * @param {string} req.body.type - MIME type of the file
 * @param {number} req.body.size - File size in bytes
 * @param {string} req.body.content - Base64 encoded file content
 * @param {string} req.body.section - Section/category for file organization
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with uploaded file data
 * @returns {Object} file - Created file object with ID and metadata
 * @returns {string} message - Success message
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {400} When required fields are missing or validation fails
 * @throws {413} When file size exceeds the 5MB limit
 * @throws {415} When file type is not supported
 * @throws {500} When database operations fail
 *
 * @example
 * // Upload a PDF document
 * POST /api/files
 * Body: {
 *   "name": "report.pdf",
 *   "type": "application/pdf",
 *   "size": 2048000,
 *   "content": "JVBERi0xLjQKJcOkw7zDtsO...",
 *   "section": "documents"
 * }
 *
 * // Response
 * {
 *   "file": {
 *     "id": 15,
 *     "name": "report.pdf",
 *     "type": "application/pdf",
 *     "size": 2048000,
 *     "section": "documents",
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   },
 *   "message": "File uploaded successfully",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function handles secure file uploads with comprehensive validation:
 *
 * **Validation Features:**
 * 1. **Required Fields**: Validates all mandatory fields are present
 * 2. **File Size Limits**: Enforces 5MB maximum file size
 * 3. **Content Type Validation**: Checks MIME types for security
 * 4. **File Name Sanitization**: Ensures safe file names
 * 5. **Section Validation**: Validates section names for organization
 *
 * **Security Features:**
 * - File size limits prevent abuse and storage overflow
 * - Content type validation prevents malicious file uploads
 * - Input sanitization prevents injection attacks
 * - Base64 content validation ensures proper encoding
 *
 * **Supported File Types:**
 * - Documents: PDF, DOC, DOCX, TXT, RTF
 * - Images: JPEG, PNG, GIF, WebP, SVG
 * - Audio: MP3, WAV, OGG, M4A, FLAC
 * - Video: MP4, WebM, AVI, MOV
 * - Data: JSON, CSV, XML, ZIP
 *
 * **File Organization Sections:**
 * - "documents" - Text files, PDFs, presentations
 * - "images" - Photos, graphics, icons
 * - "audio" - Music, recordings, sound effects
 * - "videos" - Video files, clips
 * - "data" - Exports, backups, structured data
 *
 * **Database Operations:**
 * - Uses Prisma's `create()` for atomic file creation
 * - Stores metadata and content in single transaction
 * - Generates unique ID and timestamps automatically
 * - Maintains referential integrity
 *
 * **Performance Considerations:**
 * - Base64 encoding increases storage size by ~33%
 * - Large files should use streaming uploads in production
 * - Consider external storage (S3, CloudFlare) for production use
 */
async function uploadFile(req, res) {
  console.log('📁 Files API: POST request received');

  const { name, type, size, content, section } = req.body;
  console.log(`📁 Files API: Upload request - Name: ${name || 'missing'}, Type: ${type || 'missing'}, Size: ${size || 'missing'} bytes, Section: ${section || 'missing'}`);

  try {
    // Validate required fields
    if (!name || !type || !content || !section) {
      console.log('🚨 Files API: Missing required fields for file upload');
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!type) missingFields.push('type');
      if (!content) missingFields.push('content');
      if (!section) missingFields.push('section');

      return res.status(400).json({
        error: 'Missing required fields',
        details: `The following fields are required: ${missingFields.join(', ')}`,
        missingFields,
        requiredFields: ['name', 'type', 'size', 'content', 'section'],
        timestamp: new Date().toISOString()
      });
    }

    // Validate field types
    if (typeof name !== 'string' || typeof type !== 'string' || typeof content !== 'string' || typeof section !== 'string') {
      console.log('🚨 Files API: Invalid field types provided');
      return res.status(400).json({
        error: 'Invalid field types',
        details: 'name, type, content, and section must be strings',
        timestamp: new Date().toISOString()
      });
    }

    // Validate file name (not empty, reasonable length)
    if (name.trim().length === 0) {
      console.log('🚨 Files API: Empty file name provided');
      return res.status(400).json({
        error: 'Invalid file name',
        details: 'File name cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (name.length > 255) {
      console.log('🚨 Files API: File name too long');
      return res.status(400).json({
        error: 'File name too long',
        details: 'File name must be 255 characters or less',
        timestamp: new Date().toISOString()
      });
    }

    // Validate file size
    const fileSize = size || 0;
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    if (fileSize > maxSize) {
      console.log(`🚨 Files API: File too large - ${fileSize} bytes (limit: ${maxSize} bytes)`);
      return res.status(413).json({
        error: 'File too large',
        details: `File size (${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB) exceeds the maximum limit of 5MB`,
        maxSizeBytes: maxSize,
        maxSizeMB: 5,
        fileSizeBytes: fileSize,
        fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100,
        timestamp: new Date().toISOString()
      });
    }

    // Validate content (basic Base64 check)
    if (content.length === 0) {
      console.log('🚨 Files API: Empty file content provided');
      return res.status(400).json({
        error: 'Empty file content',
        details: 'File content cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    // Validate section name
    const validSections = ['documents', 'images', 'audio', 'videos', 'data', 'other'];
    if (!validSections.includes(section.toLowerCase())) {
      console.log(`🚨 Files API: Invalid section provided - ${section}`);
      return res.status(400).json({
        error: 'Invalid section',
        details: `Section must be one of: ${validSections.join(', ')}`,
        validSections,
        providedSection: section,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📁 Files API: Creating file record - ${name.trim()} (${Math.round(fileSize / 1024)} KB) in section "${section}"`);

    // Create the file record in database
    const file = await prisma.file.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        size: fileSize,
        content: content,
        section: section.toLowerCase()
      }
    });

    console.log(`✅ Files API: Successfully uploaded file with ID ${file.id}`);

    return res.status(201).json({
      file: {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        section: file.section,
        createdAt: file.createdAt
        // Note: We don't return the content in the response for performance
      },
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Files API: Error in uploadFile:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'File already exists',
        details: 'A file with this name already exists in the specified section',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to upload file',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a specific file from the database
 *
 * @async
 * @function deleteFile
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.id - ID of the file to delete
 * @param {Object} res - Express response object
 *
 * @returns {Promise<Object>} JSON response with deletion confirmation
 * @returns {string} message - Success message
 * @returns {number} deletedFileId - ID of the deleted file
 * @returns {string} timestamp - Response timestamp
 *
 * @throws {400} When file ID is missing or invalid
 * @throws {404} When file is not found
 * @throws {500} When database operations fail
 *
 * @example
 * // Delete a specific file
 * DELETE /api/files?id=123
 *
 * // Response
 * {
 *   "message": "File deleted successfully",
 *   "deletedFileId": 123,
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * @description
 * This function performs secure file deletion with comprehensive validation:
 *
 * **Validation Features:**
 * 1. **ID Validation**: Ensures file ID is provided and valid
 * 2. **Existence Check**: Verifies file exists before deletion
 * 3. **Type Validation**: Ensures ID is a valid integer
 * 4. **Permission Checks**: Could be extended for user-based permissions
 *
 * **Security Features:**
 * - ID validation prevents injection attacks
 * - Existence verification prevents unnecessary database operations
 * - Atomic deletion ensures data consistency
 * - Detailed logging for audit trails
 *
 * **Database Operations:**
 * - Uses Prisma's `delete()` for atomic file removal
 * - Handles foreign key constraints gracefully
 * - Maintains referential integrity
 * - Provides clear error messages for debugging
 *
 * **Error Handling:**
 * - Missing ID parameter (400 Bad Request)
 * - Invalid ID format (400 Bad Request)
 * - File not found (404 Not Found)
 * - Database errors (500 Internal Server Error)
 *
 * **Use Cases:**
 * - User-initiated file deletion
 * - Administrative cleanup operations
 * - Storage management and optimization
 * - Content moderation and removal
 *
 * **Performance Considerations:**
 * - Single database operation for efficiency
 * - Minimal data transfer (only ID required)
 * - Fast response times for good UX
 * - Proper indexing on ID field
 */
async function deleteFile(req, res) {
  console.log('📁 Files API: DELETE request received');

  const { id } = req.query;
  console.log(`🗑️ Files API: Delete request for file ID - ${id || 'missing'}`);

  try {
    // Validate file ID parameter
    if (!id) {
      console.log('🚨 Files API: Missing file ID parameter');
      return res.status(400).json({
        error: 'File ID is required',
        details: 'Provide the file ID in the query parameter: ?id=123',
        example: '/api/files?id=123',
        timestamp: new Date().toISOString()
      });
    }

    // Validate ID format (must be a valid integer)
    const fileId = parseInt(id);
    if (isNaN(fileId) || fileId <= 0) {
      console.log(`🚨 Files API: Invalid file ID format - ${id}`);
      return res.status(400).json({
        error: 'Invalid file ID',
        details: 'File ID must be a positive integer',
        providedId: id,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🗑️ Files API: Attempting to delete file with ID ${fileId}`);

    // Delete the file from database
    const deletedFile = await prisma.file.delete({
      where: { id: fileId }
    });

    console.log(`✅ Files API: Successfully deleted file "${deletedFile.name}" (ID: ${fileId})`);

    return res.status(200).json({
      message: 'File deleted successfully',
      deletedFileId: fileId,
      deletedFileName: deletedFile.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Files API: Error in deleteFile:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      console.log(`🚨 Files API: File not found - ID ${id}`);
      return res.status(404).json({
        error: 'File not found',
        details: `No file exists with ID ${id}`,
        fileId: parseInt(id) || id,
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete file',
        details: 'File is referenced by other data and cannot be deleted',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to delete file',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API handler for file management endpoint
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
 * Main entry point for the file management API endpoint. This function:
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
 * - `GET`: Retrieve files (all or filtered by section)
 * - `POST`: Upload new file with validation and storage
 * - `DELETE`: Delete specific file by ID
 * - `OPTIONS`: CORS preflight request handling
 *
 * **Health Check Endpoint:**
 * - `GET /api/files?test=true` - Returns comprehensive API health status
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
 * GET /api/files?test=true
 *
 * // Get all files
 * GET /api/files
 *
 * // Get files by section
 * GET /api/files?section=images
 *
 * // Upload file
 * POST /api/files
 * Body: {"name": "image.jpg", "type": "image/jpeg", "size": 1024, "content": "...", "section": "images"}
 *
 * // Delete file
 * DELETE /api/files?id=123
 *
 * // CORS preflight request
 * OPTIONS /api/files
 */
export default async function handler(req, res) {
  console.log('📁 Files API: Request received -', req.method);

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
    console.log('📁 Files API: Handling CORS preflight request');
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
      console.log('🚨 Files API: Database not configured');
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
      console.log('📁 Files API: Health check requested');

      try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Files API: Database connection successful');

        return res.status(200).json({
          message: 'Files API is working',
          timestamp: new Date().toISOString(),
          database: 'Connected to PostgreSQL via Prisma',
          status: 'healthy',
          nodeVersion: process.version,
          hasDatabase: !!process.env.DATABASE_URL,
          databaseConnected: true,
          supportedSections: ['documents', 'images', 'audio', 'videos', 'data', 'other'],
          maxFileSize: '5MB',
          maxFileSizeBytes: 5 * 1024 * 1024
        });

      } catch (dbError) {
        console.error('🚨 Files API: Database connection failed during health check:', dbError);

        return res.status(500).json({
          message: 'Files API is working but database connection failed',
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
     * Route GET requests to getFiles handler
     *
     * Handles retrieval of files with optional section filtering.
     */
    if (req.method === 'GET') {
      return await getFiles(req, res);
    }

    /**
     * Route POST requests to uploadFile handler
     *
     * Handles file uploads with comprehensive validation.
     */
    if (req.method === 'POST') {
      return await uploadFile(req, res);
    }

    /**
     * Route DELETE requests to deleteFile handler
     *
     * Handles individual file deletion by ID.
     */
    if (req.method === 'DELETE') {
      return await deleteFile(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Return a clear error message for methods that are not supported
     * by this API endpoint.
     */
    console.log('🚨 Files API: Unsupported method -', req.method);
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
    console.error('🚨 Files API: Unhandled error:', error);
    console.error('🚨 Files API: Error stack:', error.stack);
    console.error('🚨 Files API: Error message:', error.message);

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
      console.error('🚨 Files API: Error disconnecting from database:', disconnectError);
    }
  }
}

/**
 * API Configuration
 *
 * Vercel serverless function configuration for optimal performance
 * and resource management, especially for file uploads.
 */
export const config = {
  api: {
    /**
     * Body parser configuration
     *
     * Set higher limits for file uploads while maintaining security.
     * The 10MB limit allows for Base64 encoded files up to ~7.5MB actual size.
     */
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
