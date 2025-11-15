# Code Documentation Standards

**Project**: Musicare - Music for Health & Wellness  
**Purpose**: Comprehensive code documentation formula and standards  
**Date**: November 13, 2025  
**Version**: 1.0.0

---

## Overview

This document defines the **exact formula** for documenting all code in the Musicare project. Following these standards ensures consistent, professional-grade documentation that enables easy onboarding, maintenance, and collaboration.

---

## Documentation Philosophy

### Core Principles
1. **Explain WHY, not just WHAT** - Business context and reasoning
2. **Assume new developer** - Complete explanations without prior knowledge
3. **Include examples** - Real usage scenarios and code samples
4. **Document errors** - All possible error conditions and handling
5. **Privacy-conscious** - Mask sensitive data in logs and examples
6. **Structured logging** - Consistent emoji prefixes and context

---

## File-Level Documentation Formula

### Template Structure
```javascript
/**
 * @fileoverview [Brief Description - What this file does]
 * 
 * [Detailed description - 2-3 sentences explaining the module's purpose,
 * its role in the application, and key functionality it provides]
 * 
 * @author Musicare Development Team
 * @version 1.0.0
 * @since [YYYY-MM-DD]
 * 
 * @requires [dependency1] - [What it's used for]
 * @requires [dependency2] - [What it's used for]
 * 
 * @example
 * // [Primary usage example]
 * // [Secondary usage example]
 * // [Health check or test example]
 */
```

### Real Example
```javascript
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
 * // GET /api/users - Retrieve users
 * // POST /api/users - Create new user
 * // PATCH /api/users - Update user profile
 * // GET /api/users?test=true - Health check
 */
```

---

## Function Documentation Formula

### Template Structure
```javascript
/**
 * [Brief function description - one line]
 * 
 * [Detailed description - 2-4 sentences explaining:
 * - What the function does
 * - When it's used
 * - How it fits into the larger system
 * - Any important business logic]
 * 
 * @async [if function is async]
 * @function [functionName]
 * @param {Type} paramName - [Description of parameter and its purpose]
 * @param {Type} paramName.property - [For object parameters, describe properties]
 * @returns {Type} [Description of return value and structure]
 * 
 * @throws {Error} [HTTP_CODE] - [When this error occurs]
 * @throws {Error} [HTTP_CODE] - [When this error occurs]
 * 
 * @example
 * // [Primary usage example with real data]
 * [HTTP_METHOD] [endpoint]
 * {
 *   "field": "example_value"
 * }
 * 
 * @example
 * // [Alternative usage example]
 * 
 * @todo [Future improvements or known limitations]
 */
```

### Real Example
```javascript
/**
 * GET Request Handler - Retrieve User Information
 *
 * Fetches user data from the database using either email or Firebase UID.
 * This endpoint supports user authentication flows and profile lookups.
 * Used by frontend components to load user profiles and verify account status.
 *
 * @async
 * @function getUserHandler
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
 *
 * @todo Add support for batch user lookups
 */
```

---

## Inline Comment Standards

### Block Comments Formula
```javascript
/**
 * [Purpose of this code block]
 *
 * [Detailed explanation including:
 * - Why this approach was chosen
 * - Business logic context
 * - Any important considerations
 * - Security or performance implications]
 */
```

### Single Line Comments Formula
```javascript
// [Brief explanation of the line's purpose]
```

### Real Examples
```javascript
/**
 * Validate required parameters
 *
 * At least one identifier (email or firebaseUid) must be provided
 * to perform the user lookup. Both are unique identifiers in our system.
 * Firebase UID is preferred as it's more stable than email addresses.
 */
if (!email && !firebaseUid) {
  // Log validation failure for debugging
  console.log('🚨 Users API: Missing required parameters');
  return res.status(400).json({
    error: 'Either email or firebaseUid is required'
  });
}
```

---

## Logging Standards

### Emoji Prefix System
- 🔍 **Information/Debug** - General information, lookups, searches
- ➕ **Create Operations** - Adding new records, POST requests
- 🔄 **Update Operations** - Modifying existing records, PATCH/PUT requests
- ❌ **Delete Operations** - Removing records, DELETE requests
- ✅ **Success** - Successful operations, confirmations
- 🚨 **Errors** - Error conditions, failures, exceptions
- ⚠️ **Warnings** - Non-critical issues, deprecations
- 🎵 **Music/Audio** - Music player, playlist, audio operations
- 👥 **Social/Friends** - Friend system, social features
- 🔐 **Authentication** - Auth operations, login, logout
- 📊 **Database** - Database operations, queries, connections

### Logging Formula
```javascript
// Pattern: console.log('[EMOJI] [MODULE]: [ACTION] - [CONTEXT]');

// Examples:
console.log('🔍 Users API: GET request received');
console.log('➕ Users API: Creating new user in database...');
console.log('✅ Users API: User created successfully');
console.log('🚨 Users API: Database connection failed:', error);
```

### Privacy-Conscious Logging
```javascript
// ❌ DON'T: Log sensitive data
console.log('User data:', { email: 'user@example.com', password: 'secret123' });

// ✅ DO: Mask sensitive information
console.log('🔍 Users API: User data -', {
  email: email ? '***@' + email.split('@')[1] : 'not provided',
  firebaseUid: firebaseUid ? firebaseUid.substring(0, 8) + '...' : 'not provided'
});
```

---

## Error Handling Documentation

### Error Response Formula
```javascript
return res.status([HTTP_CODE]).json({
  error: '[User-friendly error message]',
  details: '[Technical details for developers]',
  timestamp: new Date().toISOString()
});
```

### Prisma Error Handling Template
```javascript
/**
 * Handle specific Prisma errors
 *
 * P2002: Unique constraint violation - duplicate record
 * P2025: Record not found - invalid ID or deleted record
 * P2003: Foreign key constraint - related record missing
 */
if (error.code === 'P2002') {
  const field = error.meta?.target?.[0] || 'field';
  return res.status(409).json({
    error: `${field} already exists`,
    details: `A record with this ${field} already exists in the system`,
    timestamp: new Date().toISOString()
  });
}
```

---

## Class Documentation Formula

### Template Structure
```javascript
/**
 * [Class name and brief description]
 *
 * [Detailed description of the class purpose, responsibilities,
 * and how it fits into the application architecture]
 *
 * @class [ClassName]
 * @example
 * // [How to instantiate and use the class]
 * const instance = new ClassName(options);
 * await instance.method();
 */
class ClassName {
  /**
   * [Constructor description]
   *
   * @param {Object} options - Configuration options
   * @param {string} options.property - Description of property
   */
  constructor(options) {
    // Implementation
  }

  /**
   * [Method description following function formula above]
   */
  async method() {
    // Implementation
  }
}
```

---

## API Endpoint Documentation

### Request/Response Examples
```javascript
/**
 * @example
 * // Create new user with health preferences
 * POST /api/users
 * Content-Type: application/json
 *
 * {
 *   "email": "user@example.com",
 *   "displayName": "John Doe",
 *   "healthGoals": ["stress_relief", "sleep_improvement"],
 *   "musicPreferences": ["classical", "ambient"],
 *   "dailyListeningGoal": 30
 * }
 *
 * // Response: 201 Created
 * {
 *   "message": "User created successfully",
 *   "user": {
 *     "id": "uuid-123",
 *     "email": "user@example.com",
 *     "displayName": "John Doe",
 *     "healthGoals": ["stress_relief", "sleep_improvement"],
 *     "createdAt": "2024-11-13T10:30:00.000Z"
 *   },
 *   "timestamp": "2024-11-13T10:30:00.000Z"
 * }
 */
```

---

## Documentation Checklist

### For Every File
- [ ] File-level JSDoc header with @fileoverview
- [ ] Author, version, and date information
- [ ] Dependencies listed with @requires
- [ ] Usage examples in file header

### For Every Function
- [ ] Complete JSDoc block with description
- [ ] All parameters documented with types
- [ ] Return value documented
- [ ] All possible errors documented with @throws
- [ ] At least one @example with real data
- [ ] Async functions marked with @async

### For Every Code Block
- [ ] Block comment explaining purpose and context
- [ ] Business logic reasoning documented
- [ ] Security considerations noted
- [ ] Performance implications mentioned

### For Every API Endpoint
- [ ] HTTP methods supported
- [ ] Request/response examples
- [ ] Error conditions documented
- [ ] Authentication requirements noted
- [ ] Rate limiting or usage notes

---

## Implementation Workflow

### Step 1: File Header
1. Add @fileoverview with module purpose
2. Add metadata (author, version, date)
3. List all dependencies with @requires
4. Add usage examples

### Step 2: Function Documentation
1. Document main handler function first
2. Add JSDoc for each HTTP method handler
3. Document helper functions
4. Add error handling documentation

### Step 3: Inline Comments
1. Add block comments for complex logic
2. Explain business rules and decisions
3. Document security considerations
4. Add performance notes where relevant

### Step 4: Logging Enhancement
1. Add structured logging with emoji prefixes
2. Mask sensitive data in logs
3. Add context information
4. Include timing for performance monitoring

### Step 5: Error Enhancement
1. Add detailed error messages
2. Include timestamps in responses
3. Document Prisma error codes
4. Add development vs production error details

---

## Quality Metrics

### Documentation Coverage Targets
- **File Headers**: 100% of files
- **Function Documentation**: 100% of public functions
- **Inline Comments**: 1 comment per 10 lines of code
- **Error Handling**: 100% of error conditions documented
- **Examples**: At least 1 example per public function

### Review Checklist
- [ ] Can a new developer understand the code without asking questions?
- [ ] Are all business rules and decisions explained?
- [ ] Are error conditions clearly documented?
- [ ] Are examples realistic and helpful?
- [ ] Is sensitive data properly masked in logs?
- [ ] Are performance implications noted?
- [ ] Is the documentation up-to-date with the code?

---

This documentation standard will transform the Musicare codebase into an enterprise-grade, maintainable, and team-friendly project! 🚀
```
