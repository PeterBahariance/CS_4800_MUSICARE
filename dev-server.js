import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env.local') });

// Set up __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Rest of your imports
import mockFilesHandler from './api/mock-files.js';
import mockPeopleHandler from './api/mock-people.js';

const app = express();
const PORT = 3000;

// Rest of your server setup...

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

// Import and use the users API handler
import usersHandler from './api/users/index.js';
app.all('/api/users', async (req, res) => {
  try {
    await usersHandler(req, res);
  } catch (error) {
    console.error('Users API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the friends API handler
import friendsHandler from './api/friends.js';
app.all('/api/friends', async (req, res) => {
  try {
    await friendsHandler(req, res);
  } catch (error) {
    console.error('Friends API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the search users API handler
import searchUsersHandler from './api/search-users.js';
app.all('/api/search-users', async (req, res) => {
  try {
    await searchUsersHandler(req, res);
  } catch (error) {
    console.error('Search Users API Error:', error);
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
