import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Set up __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const frontendRoot = join(projectRoot, 'frontend');

// Load environment variables from .env.local at the project root
config({ path: join(projectRoot, '.env.local') });

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Rest of your imports
import filesHandler from '../express-handlers/files.js';
import peopleHandler from '../express-handlers/people.js';

const app = express();
const PORT = 3000;

// Rest of your server setup...

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(frontendRoot));
app.use('/assets', express.static(join(projectRoot, 'dist', 'assets')));

// API Routes
app.all('/api/files', async (req, res) => {
  try {
    await filesHandler(req, res);
  } catch (error) {
    console.error('Files API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/people', async (req, res) => {
  try {
    await peopleHandler(req, res);
  } catch (error) {
    console.error('People API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the users API handler
import usersHandler from '../express-handlers/users/index.js';
app.all('/api/users', async (req, res) => {
  try {
    await usersHandler(req, res);
  } catch (error) {
    console.error('Users API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the friends API handler
import friendsHandler from '../express-handlers/friends.js';
app.all('/api/friends', async (req, res) => {
  try {
    await friendsHandler(req, res);
  } catch (error) {
    console.error('Friends API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the search users API handler
import searchUsersHandler from '../express-handlers/search-users.js';
app.all('/api/search-users', async (req, res) => {
  try {
    await searchUsersHandler(req, res);
  } catch (error) {
    console.error('Search Users API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the playlists API handler
import playlistsHandler from '../express-handlers/playlists.js';
app.all('/api/playlists', async (req, res) => {
  try {
    await playlistsHandler(req, res);
  } catch (error) {
    console.error('Playlists API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the library API handler
import libraryHandler from '../express-handlers/library.js';
app.all('/api/library', async (req, res) => {
  try {
    await libraryHandler(req, res);
  } catch (error) {
    console.error('Library API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and use the messages API handler
import messagesHandler from '../express-handlers/messages.js';
app.all('/api/messages', async (req, res) => {
  try {
    await messagesHandler(req, res);
  } catch (error) {
    console.error('Messages API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route for serving index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve index.html for all non-API routes
  res.sendFile(join(frontendRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📁 Static files served from ${frontendRoot}`);
  console.log(`🔌 API endpoints available at /api/*`);
});
