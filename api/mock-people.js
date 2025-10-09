// Mock API for people operations in local development
let mockPeople = [];
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
        message: 'Mock People API is working', 
        timestamp: new Date().toISOString(),
        hasDatabase: false,
        nodeVersion: process.version,
        databaseConnected: false,
        mode: 'mock'
      });
    }
    
    if (req.method === 'GET') {
      // Get all people
      return res.status(200).json({ 
        people: mockPeople.sort((a, b) => a.id - b.id) 
      });
    }

    if (req.method === 'POST') {
      // Check if we're populating the database with sample data
      if (req.body.action === 'populate') {
        // Sample data to populate
        const samplePeople = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
          { firstName: 'Bob', lastName: 'Johnson' }
        ];

        // Clear existing data first (for demo purposes)
        mockPeople = [];
        nextId = 1;

        // Insert sample data
        const createdPeople = samplePeople.map(person => ({
          id: nextId++,
          firstName: person.firstName,
          lastName: person.lastName
        }));

        mockPeople = createdPeople;

        return res.status(201).json({ 
          message: 'Database populated successfully',
          count: createdPeople.length,
          people: mockPeople
        });
      }

      // Handle individual person creation
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields: firstName and lastName' });
      }

      const person = {
        id: nextId++,
        firstName,
        lastName
      };

      mockPeople.push(person);
      return res.status(201).json({ person });
    }

    if (req.method === 'DELETE') {
      // Clear all people from mock storage
      const deletedCount = mockPeople.length;
      mockPeople = [];
      nextId = 1;

      return res.status(200).json({
        message: 'All people deleted successfully',
        deletedCount: deletedCount
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Mock People API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
