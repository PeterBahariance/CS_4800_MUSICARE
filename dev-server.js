import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Set DATABASE_URL for local development if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/musicare_dev';
}

import mockFilesHandler from './api/mock-files.js';
import mockPeopleHandler from './api/mock-people.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// API Routes
app.all('/api/files', async (req, res) => {
  try {
    await mockFilesHandler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/people', async (req, res) => {
  try {
    await mockPeopleHandler(req, res);
  } catch (error) {
    console.error('People API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route for serving index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all non-API routes
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📁 Static files served from current directory`);
  console.log(`🔌 API endpoints available at /api/*`);
});
