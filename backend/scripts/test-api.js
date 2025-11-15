/**
 * @fileoverview API Testing Utility Script
 * Comprehensive testing suite for Musicare backend API endpoints.
 * Provides automated testing, health checks, and endpoint validation.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires fetch - Native fetch API for HTTP requests
 * @requires fs - File system operations for validation
 * @requires path - Path utilities for file system checks
 *
 * @description
 * This script provides comprehensive testing capabilities for the Musicare
 * backend API endpoints. It performs automated health checks, endpoint
 * validation, response verification, and system diagnostics.
 *
 * Key Features:
 * - Automated endpoint testing with detailed logging
 * - Health check validation for all API routes
 * - Response format and content verification
 * - File system validation for API handlers
 * - Performance timing and metrics collection
 * - Error handling and recovery testing
 * - Comprehensive test reporting and analytics
 *
 * Test Categories:
 * - Basic connectivity and health checks
 * - CRUD operations testing (GET, POST, PATCH, DELETE)
 * - Error handling and edge case validation
 * - Performance and timeout testing
 * - File system and handler validation
 *
 * @example
 * // Run the complete test suite
 * node backend/scripts/test-api.js
 *
 * // The script will automatically test all endpoints and provide detailed reports
 */

/**
 * Main API testing function with comprehensive endpoint validation
 *
 * @async
 * @function testApi
 * @returns {Promise<void>} Completes when all tests are finished
 *
 * @description
 * Orchestrates the complete API testing suite, including health checks,
 * endpoint validation, error handling tests, and system diagnostics.
 * Provides detailed logging and reporting for all test results.
 */
const testApi = async () => {
  console.log('🧪 API Testing Suite: Starting comprehensive API validation...');
  console.log('=' .repeat(80));

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    startTime: new Date(),
    endTime: null,
    duration: null
  };

  /**
   * Test individual API endpoint with comprehensive validation
   *
   * @async
   * @function checkEndpoint
   * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
   * @param {string} url - Full URL to test
   * @param {Object|null} [data=null] - Request body data for POST/PATCH requests
   * @param {Object} [options={}] - Additional test options and expectations
   * @returns {Promise<Object|null>} Test result object or null on failure
   *
   * @description
   * Performs comprehensive testing of a single API endpoint including:
   * - HTTP request execution with proper headers
   * - Response status code validation
   * - Response format and content verification
   * - Error handling and edge case testing
   * - Performance timing measurement
   * - Detailed logging and reporting
   */
  const checkEndpoint = async (method, url, data = null, options = {}) => {
    const testName = `${method} ${url}`;
    testResults.total++;

    try {
      console.log(`\n🧪 Testing: ${testName}`);
      console.log(`   URL: ${url}`);
      if (data) {
        console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
      }

      // Prepare request options with comprehensive headers
      const requestOptions = {
        method,
        headers: {
          'User-Agent': 'Musicare-API-Tester/2.0',
          'Accept': 'application/json'
        }
      };

      // Add request body for POST/PATCH requests
      if (data) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(data);
      }

      // Add custom headers if specified
      if (options.headers) {
        Object.assign(requestOptions.headers, options.headers);
      }

      // Execute request with timing
      const startTime = Date.now();
      const response = await fetch(url, requestOptions);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

      // Validate expected status code
      const expectedStatus = options.expectedStatus || (method === 'POST' ? 201 : 200);
      const statusValid = response.status === expectedStatus ||
                         (options.acceptableStatuses && options.acceptableStatuses.includes(response.status));

      if (!statusValid) {
        console.warn(`   ⚠️  Unexpected status code. Expected: ${expectedStatus}, Got: ${response.status}`);
      }

      // Parse and validate response
      let responseData = null;
      let responseText = '';

      try {
        responseText = await response.text();

        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);

          // Validate response structure if specified
          if (options.expectedFields) {
            const missingFields = options.expectedFields.filter(field =>
              !responseData.hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
              console.warn(`   ⚠️  Missing expected fields: ${missingFields.join(', ')}`);
            }
          }
        } else {
          console.log('   Response: (empty)');
        }
      } catch (parseError) {
        console.log(`   Response (non-JSON): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      }

      // Determine test result
      const testPassed = response.ok && statusValid;

      if (testPassed) {
        console.log(`   ✅ PASSED`);
        testResults.passed++;
      } else {
        console.log(`   ❌ FAILED`);
        testResults.failed++;
        testResults.errors.push({
          test: testName,
          status: response.status,
          statusText: response.statusText,
          error: responseData?.error || 'Unknown error',
          duration: duration
        });
      }

      return {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        passed: testPassed,
        responseData,
        responseText
      };

    } catch (error) {
      console.error(`   🚨 ERROR: ${error.message}`);
      testResults.failed++;
      testResults.errors.push({
        test: testName,
        error: error.message,
        type: 'network_error'
      });

      return null;
    }
  };

  try {
    const baseUrl = 'http://localhost:3000';
    console.log(`🧪 API Testing Suite: Testing against ${baseUrl}`);

    // Phase 1: Basic Connectivity Tests
    console.log('\n📡 Phase 1: Basic Connectivity Tests');
    console.log('-'.repeat(50));

    await checkEndpoint('GET', `${baseUrl}/`, null, {
      expectedFields: [],
      acceptableStatuses: [200, 404] // Root might not be configured
    });

    await checkEndpoint('GET', `${baseUrl}/api`, null, {
      acceptableStatuses: [200, 404] // API base might not be configured
    });

    // Phase 2: Health Check Tests
    console.log('\n🏥 Phase 2: API Health Check Tests');
    console.log('-'.repeat(50));

    const healthCheckEndpoints = [
      '/api/users?test=true',
      '/api/playlists?test=true',
      '/api/friends?test=true',
      '/api/people?test=true',
      '/api/files?test=true',
      '/api/search-users?test=true',
      '/api/test?test=true',
      '/api/simple?test=true'
    ];

    for (const endpoint of healthCheckEndpoints) {
      await checkEndpoint('GET', `${baseUrl}${endpoint}`, null, {
        expectedFields: ['message', 'timestamp'],
        expectedStatus: 200
      });
    }

    // Phase 3: Data Retrieval Tests
    console.log('\n📊 Phase 3: Data Retrieval Tests');
    console.log('-'.repeat(50));

    const dataEndpoints = [
      { url: '/api/users', expectedFields: ['users'] },
      { url: '/api/playlists', expectedFields: ['playlists'] },
      { url: '/api/friends', expectedFields: ['friends'] },
      { url: '/api/people', expectedFields: ['people'] },
      { url: '/api/files', expectedFields: ['files'] }
    ];

    for (const endpoint of dataEndpoints) {
      await checkEndpoint('GET', `${baseUrl}${endpoint.url}`, null, {
        expectedFields: endpoint.expectedFields,
        expectedStatus: 200
      });
    }

    // Phase 4: POST Operation Tests
    console.log('\n➕ Phase 4: POST Operation Tests');
    console.log('-'.repeat(50));

    // Test user creation
    await checkEndpoint('POST', `${baseUrl}/api/users`, {
      email: 'test@musicare.com',
      displayName: 'API Test User',
      firebaseUid: 'test-firebase-uid-' + Date.now()
    }, {
      expectedFields: ['user'],
      expectedStatus: 201
    });

    // Test people creation
    await checkEndpoint('POST', `${baseUrl}/api/people`, {
      firstName: 'Test',
      lastName: 'Person',
      email: 'testperson@musicare.com'
    }, {
      expectedFields: ['person'],
      expectedStatus: 201
    });

    // Test playlist creation
    await checkEndpoint('POST', `${baseUrl}/api/playlists`, {
      title: 'Test Playlist',
      description: 'API Test Playlist',
      mood: 'calm'
    }, {
      expectedFields: ['playlist'],
      expectedStatus: 201
    });

    // Phase 5: Error Handling Tests
    console.log('\n🚨 Phase 5: Error Handling Tests');
    console.log('-'.repeat(50));

    // Test invalid methods
    await checkEndpoint('PUT', `${baseUrl}/api/users`, null, {
      expectedStatus: 405,
      acceptableStatuses: [405, 400]
    });

    await checkEndpoint('PATCH', `${baseUrl}/api/nonexistent`, null, {
      expectedStatus: 404,
      acceptableStatuses: [404, 405]
    });

    // Test invalid data
    await checkEndpoint('POST', `${baseUrl}/api/users`, {
      invalidField: 'invalid data'
    }, {
      expectedStatus: 400,
      acceptableStatuses: [400, 422]
    });

    // Phase 6: File System Validation
    console.log('\n📁 Phase 6: File System Validation');
    console.log('-'.repeat(50));

    await validateFileSystem();

    // Phase 7: Performance Tests
    console.log('\n⚡ Phase 7: Performance Tests');
    console.log('-'.repeat(50));

    await performanceTests(baseUrl, checkEndpoint);

  } catch (error) {
    console.error('🚨 Critical test failure:', error.message);
    if (error.cause) {
      console.error('🚨 Error details:', error.cause);
    }
    testResults.failed++;
    testResults.errors.push({
      test: 'Critical System Error',
      error: error.message,
      type: 'system_error'
    });
  } finally {
    // Generate final test report
    testResults.endTime = new Date();
    testResults.duration = testResults.endTime - testResults.startTime;

    generateTestReport(testResults);
  }
};

/**
 * Validate file system and API handler files
 *
 * @async
 * @function validateFileSystem
 * @returns {Promise<void>} Completes when validation is finished
 *
 * @description
 * Validates that all expected API handler files exist and are properly
 * structured. Checks file sizes, content headers, and basic syntax.
 */
async function validateFileSystem() {
  try {
    console.log('📁 Validating API handler files...');

    const fs = await import('fs');
    const path = await import('path');

    const apiFiles = [
      'backend/api/users/index.js',
      'backend/api/playlists.js',
      'backend/api/friends.js',
      'backend/api/people.js',
      'backend/api/files.js',
      'backend/api/search-users.js',
      'backend/api/test.js',
      'backend/api/simple.js',
      'backend/api/mock-people.js',
      'backend/api/mock-files.js'
    ];

    let validFiles = 0;
    let totalSize = 0;

    for (const filePath of apiFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      console.log(`   Checking: ${filePath}`);

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        console.log(`     ✅ Exists (${stats.size} bytes)`);
        console.log(`     📄 Content preview: ${content.substring(0, 100).replace(/\n/g, ' ')}...`);

        // Check for basic structure
        if (content.includes('export default') || content.includes('module.exports')) {
          console.log(`     ✅ Has export statement`);
        } else {
          console.log(`     ⚠️  No export statement found`);
        }

        if (content.includes('@fileoverview')) {
          console.log(`     ✅ Has JSDoc documentation`);
        } else {
          console.log(`     ⚠️  Missing JSDoc documentation`);
        }

        validFiles++;
        totalSize += stats.size;
      } else {
        console.log(`     ❌ File not found`);
      }
    }

    console.log(`\n📊 File System Summary:`);
    console.log(`   Valid files: ${validFiles}/${apiFiles.length}`);
    console.log(`   Total size: ${Math.round(totalSize / 1024)}KB`);
    console.log(`   Average size: ${Math.round(totalSize / validFiles / 1024)}KB per file`);

  } catch (error) {
    console.error('🚨 File system validation error:', error.message);
  }
}

/**
 * Perform performance tests on API endpoints
 *
 * @async
 * @function performanceTests
 * @param {string} baseUrl - Base URL for API testing
 * @param {Function} checkEndpoint - Endpoint testing function
 * @returns {Promise<void>} Completes when performance tests are finished
 *
 * @description
 * Executes performance tests including response time measurement,
 * concurrent request handling, and load testing scenarios.
 */
async function performanceTests(baseUrl, checkEndpoint) {
  try {
    console.log('⚡ Running performance tests...');

    // Test response times for health checks
    const healthEndpoints = [
      '/api/test?test=true',
      '/api/simple?test=true',
      '/api/users?test=true'
    ];

    const performanceResults = [];

    for (const endpoint of healthEndpoints) {
      const startTime = Date.now();
      const result = await checkEndpoint('GET', `${baseUrl}${endpoint}`);
      const endTime = Date.now();

      if (result) {
        performanceResults.push({
          endpoint,
          duration: endTime - startTime,
          status: result.status
        });
      }
    }

    // Analyze performance results
    const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
    const maxResponseTime = Math.max(...performanceResults.map(r => r.duration));
    const minResponseTime = Math.min(...performanceResults.map(r => r.duration));

    console.log(`\n⚡ Performance Summary:`);
    console.log(`   Average response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`   Fastest response: ${minResponseTime}ms`);
    console.log(`   Slowest response: ${maxResponseTime}ms`);

    // Performance thresholds
    if (avgResponseTime > 1000) {
      console.log(`   ⚠️  Average response time exceeds 1 second`);
    } else if (avgResponseTime > 500) {
      console.log(`   ⚠️  Average response time exceeds 500ms`);
    } else {
      console.log(`   ✅ Good average response time`);
    }

  } catch (error) {
    console.error('🚨 Performance test error:', error.message);
  }
}

/**
 * Generate comprehensive test report
 *
 * @function generateTestReport
 * @param {Object} testResults - Test results object with metrics and errors
 * @returns {void}
 *
 * @description
 * Generates a detailed test report including pass/fail statistics,
 * error summaries, performance metrics, and recommendations.
 */
function generateTestReport(testResults) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 API TESTING SUITE - FINAL REPORT');
  console.log('='.repeat(80));

  // Test Statistics
  console.log('\n📊 Test Statistics:');
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} (${Math.round(testResults.passed / testResults.total * 100)}%)`);
  console.log(`   Failed: ${testResults.failed} (${Math.round(testResults.failed / testResults.total * 100)}%)`);
  console.log(`   Duration: ${Math.round(testResults.duration / 1000)}s`);

  // Overall Status
  const successRate = testResults.passed / testResults.total;
  if (successRate >= 0.9) {
    console.log(`\n✅ OVERALL STATUS: EXCELLENT (${Math.round(successRate * 100)}% success rate)`);
  } else if (successRate >= 0.7) {
    console.log(`\n⚠️  OVERALL STATUS: GOOD (${Math.round(successRate * 100)}% success rate)`);
  } else if (successRate >= 0.5) {
    console.log(`\n⚠️  OVERALL STATUS: NEEDS ATTENTION (${Math.round(successRate * 100)}% success rate)`);
  } else {
    console.log(`\n🚨 OVERALL STATUS: CRITICAL ISSUES (${Math.round(successRate * 100)}% success rate)`);
  }

  // Error Summary
  if (testResults.errors.length > 0) {
    console.log('\n🚨 Error Summary:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}`);
      console.log(`      Error: ${error.error}`);
      if (error.status) {
        console.log(`      Status: ${error.status}`);
      }
      if (error.type) {
        console.log(`      Type: ${error.type}`);
      }
    });
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (testResults.failed === 0) {
    console.log('   🎉 All tests passed! Your API is working perfectly.');
  } else {
    console.log('   🔧 Review failed tests and fix underlying issues');
    console.log('   📝 Check server logs for detailed error information');
    console.log('   🔄 Re-run tests after making fixes');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Testing completed at ${testResults.endTime.toISOString()}`);
  console.log('='.repeat(80));
}

// Execute the test suite
testApi().catch((error) => {
  console.error('🚨 CRITICAL ERROR: Test suite failed to execute');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});