// Re-enable Prisma now that ES6 exports are working
import { prisma } from '../lib/prisma.js';

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
    // Test database connection first
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing'
      });
    }

    // Test endpoint
    if (req.query.test === 'true') {
      try {
        // Test database connection
        await prisma.$connect();
        return res.status(200).json({ 
          message: 'API is working', 
          timestamp: new Date().toISOString(),
          hasDatabase: !!process.env.DATABASE_URL,
          nodeVersion: process.version,
          databaseConnected: true
        });
      } catch (dbError) {
        return res.status(500).json({ 
          message: 'API is working but database connection failed',
          timestamp: new Date().toISOString(),
          hasDatabase: !!process.env.DATABASE_URL,
          nodeVersion: process.version,
          databaseConnected: false,
          dbError: dbError.message
        });
      }
    }
    
    if (req.method === 'GET') {
      // Get all files or files for a specific section
      const { section } = req.query;
      
      const files = await prisma.file.findMany({
        where: section ? { section } : {},
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json({ files });
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

      const file = await prisma.file.create({
        data: {
          name,
          type,
          size,
          content,
          section
        }
      });

      return res.status(201).json({ file });
    }

    if (req.method === 'DELETE') {
      // Delete a file
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      await prisma.file.delete({
        where: { id: parseInt(id) }
      });
      
      return res.status(200).json({ message: 'File deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Always return JSON, never let it bubble up as HTML
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
