// Test script to check API endpoint
const testApi = async () => {
  const checkEndpoint = async (method, url, data = null) => {
    try {
      console.log(`\nTesting ${method} ${url}`);
      const options = { method };
      if (data) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      try {
        const responseData = await response.json();
        console.log('Response:', responseData);
      } catch (e) {
        console.log('Response is not JSON');
      }
      
      return response;
    } catch (error) {
      console.error(`Error testing ${method} ${url}:`, error.message);
      return null;
    }
  };
  
  try {
    const baseUrl = 'http://localhost:3000';
    
    // Test root endpoint
    await checkEndpoint('GET', `${baseUrl}/`);
    
    // Test API base endpoint
    await checkEndpoint('GET', `${baseUrl}/api`);
    
    // Test users endpoint
    await checkEndpoint('GET', `${baseUrl}/api/users`);
    await checkEndpoint('GET', `${baseUrl}/api/users?test=true`);
    
    // Test POST to users endpoint
    await checkEndpoint('POST', `${baseUrl}/api/users`, {
      email: 'test@example.com',
      displayName: 'Test User'
    });
    
    // Check if the file exists
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const apiPath = path.join(process.cwd(), 'api', 'users', 'index.js');
      console.log(`\nChecking if API file exists at: ${apiPath}`);
      console.log('File exists:', fs.existsSync(apiPath));
      
      if (fs.existsSync(apiPath)) {
        console.log('File content starts with:', 
          fs.readFileSync(apiPath, 'utf8').substring(0, 100) + '...');
      }
    } catch (e) {
      console.error('Error checking file system:', e.message);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.cause) {
      console.error('Error details:', error.cause);
    }
  }
};

testApi().catch(console.error);