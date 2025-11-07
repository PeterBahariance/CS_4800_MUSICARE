// Mock API for local development without database
let mockFiles = [];
let nextId = 1;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    // Test endpoint
    if (req.query.test === 'true') {
      return res.status(200).json({ 
        message: 'Mock API is working', 
        timestamp: new Date().toISOString(),
        hasDatabase: false,
        nodeVersion: process.version,
        databaseConnected: false,
        mode: 'mock'
      });
    }
    
    if (req.method === 'GET') {
      // Get all files or files for a specific section
      const { section } = req.query;
      
      const files = section 
        ? mockFiles.filter(file => file.section === section)
        : mockFiles;
      
      return res.status(200).json({ files: files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    }

    if (req.method === 'POST') {
      // Upload a new file
      const { name, type, size, content, section } = req.body;
      
      if (!name || !type || !content || !section) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check file size (5MB limit)
      if (size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }

      const file = {
        id: nextId++,
        name,
        type,
        size,
        content,
        section,
        createdAt: new Date().toISOString()
      };

      mockFiles.push(file);
      return res.status(201).json({ file });
    }

    if (req.method === 'DELETE') {
      // Delete a file
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      const fileIndex = mockFiles.findIndex(file => file.id === parseInt(id));
      if (fileIndex === -1) {
        return res.status(404).json({ error: 'File not found' });
      }

      mockFiles.splice(fileIndex, 1);
      return res.status(200).json({ message: 'File deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Mock API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
