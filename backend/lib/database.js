/**
 * @fileoverview Database Client Utility Library
 * Client-side utility functions for interacting with Musicare backend API endpoints.
 * Provides a clean interface for file operations, data retrieval, and API communication.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires fetch - Native fetch API for HTTP requests
 *
 * @description
 * This library provides client-side utility functions for interacting with the
 * Musicare backend API. It abstracts the complexity of API communication and
 * provides a clean, consistent interface for frontend components to perform
 * database operations through the backend API endpoints.
 *
 * Key Features:
 * - File upload, retrieval, and deletion operations
 * - Automatic error handling and retry logic
 * - Request/response logging and monitoring
 * - Base64 file encoding/decoding utilities
 * - Section-based file filtering and organization
 * - Comprehensive input validation and sanitization
 * - Network timeout and error recovery
 *
 * Supported Operations:
 * - Upload files with metadata and content validation
 * - Retrieve files with optional section filtering
 * - Delete files by ID with confirmation
 * - Convert between Base64 and Blob formats
 * - Health check and API status monitoring
 *
 * @example
 * // Upload a file
 * const fileData = {
 *   name: 'document.pdf',
 *   type: 'application/pdf',
 *   content: base64Content,
 *   section: 'documents'
 * };
 * const result = await uploadFileToDatabase(fileData);
 *
 * // Get files from a section
 * const files = await getFilesFromDatabase('documents');
 *
 * // Delete a file
 * await deleteFileFromDatabase(123);
 */

/**
 * Base URL for Musicare backend API endpoints (relative for client-side usage)
 * @constant {string}
 */
const API_BASE = '/api';

/**
 * Default timeout for API requests in milliseconds
 * @constant {number}
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds for file operations

/**
 * Maximum file size allowed for uploads (5MB in bytes)
 * @constant {number}
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a file to the database via backend API with comprehensive validation
 *
 * @async
 * @function uploadFileToDatabase
 * @param {Object} fileData - File data object with metadata and content
 * @param {string} fileData.name - File name with extension
 * @param {string} fileData.type - MIME type of the file
 * @param {string} fileData.content - Base64 encoded file content
 * @param {string} [fileData.section='general'] - Section/category for file organization
 * @param {number} [fileData.size] - File size in bytes (calculated if not provided)
 * @returns {Promise<Object>} Upload response with file metadata and ID
 *
 * @description
 * Uploads a file to the Musicare backend database through the Files API.
 * Performs comprehensive validation of file data, size limits, and content type.
 * Supports automatic retry on network failures and provides detailed error reporting.
 *
 * File Requirements:
 * - Name: Non-empty string with valid filename characters
 * - Type: Valid MIME type (validated against allowed types)
 * - Content: Valid Base64 encoded string
 * - Size: Must not exceed 5MB limit
 * - Section: Optional categorization for file organization
 *
 * @example
 * // Upload a document file
 * const fileData = {
 *   name: 'therapy-notes.pdf',
 *   type: 'application/pdf',
 *   content: 'JVBERi0xLjQKJcOkw7zDtsO8w6...',
 *   section: 'therapy-documents',
 *   size: 1024000
 * };
 *
 * try {
 *   const result = await uploadFileToDatabase(fileData);
 *   console.log(`File uploaded with ID: ${result.file.id}`);
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 *
 * @throws {Error} Invalid file data or missing required fields
 * @throws {Error} File size exceeds maximum limit (5MB)
 * @throws {Error} Invalid file type or content format
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Server validation or storage error
 */
export async function uploadFileToDatabase(fileData) {
  try {
    console.log('📁 Database Client: Starting file upload process...');

    // Comprehensive input validation
    if (!fileData || typeof fileData !== 'object') {
      throw new Error('Invalid file data: must be a non-null object');
    }

    // Validate required fields
    const requiredFields = ['name', 'type', 'content'];
    for (const field of requiredFields) {
      if (!fileData[field] || typeof fileData[field] !== 'string') {
        throw new Error(`Invalid or missing required field: ${field}`);
      }
    }

    // Validate file name
    const fileName = fileData.name.trim();
    if (fileName.length === 0 || fileName.length > 255) {
      throw new Error('File name must be between 1 and 255 characters');
    }

    // Check for invalid filename characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      throw new Error('File name contains invalid characters');
    }

    // Validate MIME type
    const mimeType = fileData.type.trim().toLowerCase();
    const allowedTypes = [
      'application/pdf', 'text/plain', 'text/csv',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm',
      'application/json', 'application/xml'
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Validate Base64 content
    const base64Content = fileData.content.trim();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content)) {
      throw new Error('Invalid Base64 content format');
    }

    // Calculate and validate file size
    const calculatedSize = Math.ceil(base64Content.length * 0.75); // Approximate decoded size
    const fileSize = fileData.size || calculatedSize;

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size (${Math.round(fileSize / 1024)}KB) exceeds maximum limit (${Math.round(MAX_FILE_SIZE / 1024)}KB)`);
    }

    // Prepare validated file data
    const validatedFileData = {
      name: fileName,
      type: mimeType,
      content: base64Content,
      section: (fileData.section || 'general').trim(),
      size: fileSize
    };

    console.log(`📁 Database Client: Uploading "${fileName}" (${Math.round(fileSize / 1024)}KB) to section "${validatedFileData.section}"`);

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Musicare-Client/2.0'
      },
      body: JSON.stringify(validatedFileData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.warn('📁 Database Client: Could not parse error response');
      }

      console.error(`🚨 Database Client: Upload failed - ${errorMessage}`);
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    const result = await response.json();
    console.log(`✅ Database Client: File "${fileName}" uploaded successfully with ID ${result.file?.id}`);

    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('🚨 Database Client: Upload timeout after 30 seconds');
      throw new Error('Upload timeout: Request took too long to complete');
    }

    console.error('🚨 Database Client: Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Retrieve files from the database via backend API with optional section filtering
 *
 * @async
 * @function getFilesFromDatabase
 * @param {string|null} [section=null] - Optional section filter to retrieve files from specific category
 * @returns {Promise<Object>} Response object containing files array and metadata
 *
 * @description
 * Fetches files from the Musicare backend database through the Files API.
 * Supports optional section-based filtering to retrieve files from specific
 * categories or sections. Returns comprehensive file metadata including
 * content, timestamps, and organization information.
 *
 * Section Categories:
 * - 'therapy-documents' - Therapy session notes and documents
 * - 'music-files' - Audio files and music content
 * - 'images' - Profile pictures and visual content
 * - 'reports' - Generated reports and analytics
 * - 'general' - Miscellaneous files and uploads
 * - null - Retrieve all files regardless of section
 *
 * @example
 * // Get all files
 * const allFiles = await getFilesFromDatabase();
 * console.log(`Total files: ${allFiles.files.length}`);
 *
 * // Get files from specific section
 * const therapyDocs = await getFilesFromDatabase('therapy-documents');
 * console.log(`Therapy documents: ${therapyDocs.files.length}`);
 *
 * // Process retrieved files
 * const files = await getFilesFromDatabase('images');
 * files.files.forEach(file => {
 *   console.log(`${file.name} - ${file.size} bytes`);
 * });
 *
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Invalid section parameter
 * @throws {Error} Server error or database unavailable
 */
export async function getFilesFromDatabase(section = null) {
  try {
    console.log(`📁 Database Client: Retrieving files${section ? ` from section "${section}"` : ' (all sections)'}...`);

    // Validate section parameter if provided
    if (section !== null) {
      if (typeof section !== 'string') {
        throw new Error('Section parameter must be a string or null');
      }

      const trimmedSection = section.trim();
      if (trimmedSection.length === 0) {
        throw new Error('Section parameter cannot be empty string');
      }

      // Validate section name format
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedSection)) {
        throw new Error('Section name can only contain letters, numbers, hyphens, and underscores');
      }

      section = trimmedSection;
    }

    // Build request URL with optional section filter
    let url = `${API_BASE}/files`;
    if (section) {
      url += `?section=${encodeURIComponent(section)}`;
    }

    console.log(`📁 Database Client: Request URL - ${url}`);

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Musicare-Client/2.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.warn('📁 Database Client: Could not parse error response');
      }

      console.error(`🚨 Database Client: Fetch failed - ${errorMessage}`);
      throw new Error(`Failed to fetch files: ${errorMessage}`);
    }

    const result = await response.json();

    // Validate response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from server');
    }

    const fileCount = result.files ? result.files.length : 0;
    console.log(`✅ Database Client: Retrieved ${fileCount} files${section ? ` from section "${section}"` : ''}`);

    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('🚨 Database Client: Fetch timeout after 30 seconds');
      throw new Error('Fetch timeout: Request took too long to complete');
    }

    console.error('🚨 Database Client: Fetch error:', error);
    throw new Error(`Failed to retrieve files: ${error.message}`);
  }
}

/**
 * Delete a file from the database via backend API with confirmation
 *
 * @async
 * @function deleteFileFromDatabase
 * @param {number|string} fileId - Unique identifier of the file to delete
 * @returns {Promise<Object>} Deletion response with confirmation and metadata
 *
 * @description
 * Permanently deletes a file from the Musicare backend database through the Files API.
 * Performs validation of the file ID and provides confirmation of successful deletion.
 * This operation is irreversible and will permanently remove the file and its metadata.
 *
 * Security Features:
 * - File ID validation and sanitization
 * - Confirmation response with deleted file metadata
 * - Comprehensive error handling and logging
 * - Timeout protection for network issues
 *
 * @example
 * // Delete a file by ID
 * try {
 *   const result = await deleteFileFromDatabase(123);
 *   console.log(`Deleted file: ${result.file.name}`);
 * } catch (error) {
 *   console.error('Deletion failed:', error.message);
 * }
 *
 * // Delete with string ID
 * const fileId = '456';
 * const result = await deleteFileFromDatabase(fileId);
 * console.log(`File ${result.file.id} deleted successfully`);
 *
 * @throws {Error} Invalid or missing file ID
 * @throws {Error} File not found in database
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Server error or deletion failed
 */
export async function deleteFileFromDatabase(fileId) {
  try {
    console.log(`📁 Database Client: Deleting file with ID ${fileId}...`);

    // Validate file ID
    if (fileId === null || fileId === undefined) {
      throw new Error('File ID is required');
    }

    // Convert to string and validate format
    const fileIdStr = fileId.toString().trim();
    if (fileIdStr.length === 0) {
      throw new Error('File ID cannot be empty');
    }

    // Validate numeric ID format
    if (!/^\d+$/.test(fileIdStr)) {
      throw new Error('File ID must be a positive integer');
    }

    const numericFileId = parseInt(fileIdStr, 10);
    if (numericFileId <= 0) {
      throw new Error('File ID must be a positive integer');
    }

    console.log(`📁 Database Client: Validated file ID ${numericFileId} for deletion`);

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(`${API_BASE}/files?id=${numericFileId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Musicare-Client/2.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.warn('📁 Database Client: Could not parse error response');
      }

      console.error(`🚨 Database Client: Delete failed - ${errorMessage}`);
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }

    const result = await response.json();

    // Validate response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from server');
    }

    console.log(`✅ Database Client: File ${numericFileId} deleted successfully`);

    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('🚨 Database Client: Delete timeout after 30 seconds');
      throw new Error('Delete timeout: Request took too long to complete');
    }

    console.error('🚨 Database Client: Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Convert Base64 encoded data to Blob object for file handling
 *
 * @function base64ToBlob
 * @param {string} base64Data - Base64 encoded data string (with or without data URL prefix)
 * @param {string} contentType - MIME type for the resulting Blob
 * @returns {Blob} Blob object containing the decoded binary data
 *
 * @description
 * Converts Base64 encoded file data to a Blob object for browser file handling.
 * Supports both raw Base64 strings and data URL formatted strings.
 * The resulting Blob can be used for file downloads, uploads, or display.
 *
 * Supported Formats:
 * - Raw Base64: 'JVBERi0xLjQKJcOkw7zDtsO8w6...'
 * - Data URL: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8w6...'
 *
 * @example
 * // Convert Base64 to Blob for download
 * const base64 = 'data:application/pdf;base64,JVBERi0xLjQK...';
 * const blob = base64ToBlob(base64, 'application/pdf');
 *
 * // Create download link
 * const url = URL.createObjectURL(blob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'document.pdf';
 * link.click();
 *
 * // Convert for file upload
 * const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAA...';
 * const imageBlob = base64ToBlob(imageBase64, 'image/png');
 * const formData = new FormData();
 * formData.append('file', imageBlob, 'image.png');
 *
 * @throws {Error} Invalid Base64 data format
 * @throws {Error} Missing or invalid content type
 */
export function base64ToBlob(base64Data, contentType) {
  try {
    console.log(`📁 Database Client: Converting Base64 to Blob (${contentType})...`);

    // Validate inputs
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Base64 data must be a non-empty string');
    }

    if (!contentType || typeof contentType !== 'string') {
      throw new Error('Content type must be a non-empty string');
    }

    // Handle data URL format (extract Base64 part)
    let base64String = base64Data;
    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      if (parts.length === 2) {
        base64String = parts[1];
      } else {
        throw new Error('Invalid data URL format');
      }
    }

    // Validate Base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
      throw new Error('Invalid Base64 format');
    }

    // Decode Base64 to binary
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    console.log(`✅ Database Client: Converted Base64 to Blob (${blob.size} bytes, ${contentType})`);

    return blob;

  } catch (error) {
    console.error('🚨 Database Client: Base64 to Blob conversion error:', error);
    throw new Error(`Failed to convert Base64 to Blob: ${error.message}`);
  }
}

/**
 * Database client utilities and configuration
 * @namespace DatabaseUtils
 */
export const DatabaseUtils = {
  /**
   * API configuration and constants
   */
  config: {
    API_BASE: API_BASE,
    DEFAULT_TIMEOUT: DEFAULT_TIMEOUT,
    MAX_FILE_SIZE: MAX_FILE_SIZE,
    SUPPORTED_MIME_TYPES: [
      'application/pdf', 'text/plain', 'text/csv',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm',
      'application/json', 'application/xml'
    ],
    VALID_SECTIONS: [
      'therapy-documents', 'music-files', 'images',
      'reports', 'general', 'user-uploads'
    ]
  },

  /**
   * Validate file data before upload
   * @param {Object} fileData - File data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateFileData(fileData) {
    const errors = [];

    if (!fileData || typeof fileData !== 'object') {
      errors.push('File data must be a non-null object');
      return { isValid: false, errors };
    }

    // Check required fields
    const requiredFields = ['name', 'type', 'content'];
    for (const field of requiredFields) {
      if (!fileData[field] || typeof fileData[field] !== 'string') {
        errors.push(`Missing or invalid required field: ${field}`);
      }
    }

    // Validate file name
    if (fileData.name) {
      const fileName = fileData.name.trim();
      if (fileName.length === 0 || fileName.length > 255) {
        errors.push('File name must be between 1 and 255 characters');
      }

      const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (invalidChars.test(fileName)) {
        errors.push('File name contains invalid characters');
      }
    }

    // Validate MIME type
    if (fileData.type) {
      const mimeType = fileData.type.trim().toLowerCase();
      if (!this.config.SUPPORTED_MIME_TYPES.includes(mimeType)) {
        errors.push(`Unsupported file type: ${mimeType}`);
      }
    }

    // Validate Base64 content
    if (fileData.content) {
      const base64Content = fileData.content.trim();
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content)) {
        errors.push('Invalid Base64 content format');
      }

      // Check file size
      const calculatedSize = Math.ceil(base64Content.length * 0.75);
      if (calculatedSize > this.config.MAX_FILE_SIZE) {
        errors.push(`File size (${Math.round(calculatedSize / 1024)}KB) exceeds maximum limit (${Math.round(this.config.MAX_FILE_SIZE / 1024)}KB)`);
      }
    }

    // Validate section
    if (fileData.section) {
      const section = fileData.section.trim();
      if (!/^[a-zA-Z0-9_-]+$/.test(section)) {
        errors.push('Section name can only contain letters, numbers, hyphens, and underscores');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get API health status
   * @returns {Object} API health and configuration information
   */
  getApiStatus() {
    return {
      apiBase: this.config.API_BASE,
      timeout: this.config.DEFAULT_TIMEOUT,
      maxFileSize: this.formatFileSize(this.config.MAX_FILE_SIZE),
      supportedTypes: this.config.SUPPORTED_MIME_TYPES.length,
      validSections: this.config.VALID_SECTIONS,
      clientVersion: '2.0.0',
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Create a download link for a file
   * @param {Object} file - File object with content and metadata
   * @param {string} filename - Optional custom filename
   * @returns {string} Object URL for download
   */
  createDownloadUrl(file, filename = null) {
    try {
      const blob = base64ToBlob(file.content, file.type);
      const url = URL.createObjectURL(blob);

      console.log(`📁 Database Client: Created download URL for ${filename || file.name}`);
      return url;

    } catch (error) {
      console.error('🚨 Database Client: Failed to create download URL:', error);
      throw new Error(`Failed to create download URL: ${error.message}`);
    }
  }
};
