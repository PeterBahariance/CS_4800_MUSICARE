/**
 * @fileoverview Playlist Management API Endpoint
 *
 * Comprehensive API for managing therapeutic music playlists in the Musicare platform.
 * Supports CRUD operations for playlists, song management, and integration with external
 * music services like Jamendo for therapeutic content discovery.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires ../lib/prisma.js - Database ORM for playlist operations
 * @requires ../lib/jamendo.js - External music service integration
 *
 * @example
 * // Get all playlists
 * GET /api/playlists
 *
 * // Get playlists by mood
 * GET /api/playlists?mood=relaxing
 *
 * // Create new playlist
 * POST /api/playlists
 * {
 *   "title": "Morning Meditation",
 *   "mood": "relaxing",
 *   "description": "Peaceful tracks for morning meditation"
 * }
 */

// API endpoint for playlist operations (category aware)
import { prisma } from '../lib/prisma.js';
import { getTherapeuticPlaylists, fetchCategoryPlaylists, CATEGORY_CONFIG, GENRE_ALIASES } from '../lib/jamendo.js';

const DEFAULT_PLAYLIST_LIMIT = 3;
const CATEGORY_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const TRACKS_PER_PLAYLIST = 8;

/**
 * GET Request Handler - Retrieve Playlists
 *
 * Fetches playlists from the database with optional mood filtering and population
 * from external music services. Supports therapeutic playlist discovery and
 * user-created playlist management.
 *
 * @async
 * @function getPlaylists
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.mood - Optional mood filter (relaxing, energizing, focus, etc.)
 * @param {string} req.query.populate - Set to 'true' to populate from Jamendo API
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with playlists array
 * @throws {Error} 400 - Invalid query parameters
 * @throws {Error} 500 - Database or external API errors
 *
 * @example
 * // Get all playlists
 * GET /api/playlists
 *
 * // Get relaxing playlists only
 * GET /api/playlists?mood=relaxing
 *
 * // Populate database with Jamendo content
 * GET /api/playlists?populate=true
 */
async function getPlaylists(req, res) {
  console.log('🎵 Playlists API: GET request received');

  const { mood, populate, limit, userId, firebaseUid, email, goal, genre } = req.query;
  console.log('🎵 Playlists API: Query params -', {
    mood: mood || 'all moods',
    populate: populate === 'true' ? 'yes' : 'no',
    goal: goal || 'none',
    genre: genre || 'none'
  });

  /**
   * Special action: Populate database with Jamendo music
   *
   * When populate=true is specified, this triggers the population
   * of the database with therapeutic playlists from Jamendo API.
   * This is typically used for initial setup or content refresh.
   */
  if (populate === 'true') {
    console.log('🎵 Playlists API: Triggering database population from Jamendo');
    return await populatePlaylists(req, res);
  }

  try {
    console.log('🎵 Playlists API: Fetching playlists from database...');

    /**
     * Build database query with optional filtering
     *
     * Priority order:
     * 1. First check database for existing playlists
     * 2. If no results and goal/genre specified, generate dynamic playlists
     * 3. Support mood filtering for therapeutic needs
     */
    let where = {};

    // Add mood filter if specified
    if (mood) {
      where.mood = mood;
    }

    // Add category filters if goal or genre specified
    const categoryType = goal ? 'goal' : genre ? 'genre' : null;
    const categoryKeyRaw = goal || genre;

    if (categoryType && categoryKeyRaw) {
      // Map health goals to populated playlist moods
      const goalToMoodMap = {
        'mental_wellness': ['anxiety', 'focus', 'sleep'],
        'stress_relief': ['anxiety', 'sleep'],
        'focus_enhancement': ['focus'],
        'sleep_improvement': ['sleep'],
        'mood_boost': ['anxiety', 'focus']
      };

      // Map genre preferences to populated playlist moods
      const genreToMoodMap = {
        'rock': ['genre_rock'],
        'rnb': ['genre_rnb'],
        'r&b': ['genre_rnb'],
        'rb': ['genre_rnb']
      };

      const mappedMoods = categoryType === 'goal'
        ? goalToMoodMap[categoryKeyRaw] || []
        : genreToMoodMap[categoryKeyRaw] || [];

      // First try to find existing playlists that match the category
      const orConditions = [];

      // Add mood filter if specified directly
      if (mood) {
        orConditions.push({ mood });
      }

      // Add mapped moods for goals/genres
      if (mappedMoods.length > 0) {
        orConditions.push({ mood: { in: mappedMoods } });
      }

      // Add category match for dynamic playlists
      orConditions.push({ category: categoryType, categoryKey: categoryKeyRaw });

      where = {
        ...where,
        OR: orConditions
      };
    }

    console.log('🎵 Playlists API: Database query filter -', where);

    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        playlistSongs: {
          include: {
            song: true
          },
          orderBy: {
            position: 'asc'
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🎵 Playlists API: Found ${playlists.length} playlists`);

    /**
     * Transform data for frontend consumption
     *
     * Restructures the complex Prisma result into a clean format
     * that the frontend can easily consume. Flattens nested relationships
     * and calculates derived fields like track count.
     */
    const formattedPlaylists = playlists.map(playlist => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      mood: playlist.mood,
      verified: playlist.verified,
      coverImage: playlist.coverImage,
      createdBy: playlist.creator,
      tracks: playlist.playlistSongs.map(ps => ({
        id: ps.song.id,
        title: ps.song.title,
        artist: ps.song.artist,
        duration: ps.song.duration,
        audioUrl: ps.song.audioUrl,
        albumArt: ps.song.albumArt,
        position: ps.position
      })),
      trackCount: playlist.playlistSongs.length,
      createdAt: playlist.createdAt
    }));

    console.log('✅ Playlists API: Playlists formatted successfully');

    // If no playlists found and category specified, try dynamic generation
    if (formattedPlaylists.length === 0 && categoryType && categoryKeyRaw) {
      console.log(`🎵 Playlists API: No database playlists found, generating dynamic playlists for ${categoryType}:${categoryKeyRaw}`);
      return await handleCategoryPlaylists(req, res, categoryType, categoryKeyRaw);
    }

    return res.status(200).json({
      message: 'Playlists retrieved successfully',
      playlists: formattedPlaylists,
      count: formattedPlaylists.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Playlists API: Error fetching playlists:', error);
    return res.status(500).json({
      error: 'Failed to fetch playlists',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST Request Handler - Create New Playlist
 *
 * Creates a new therapeutic playlist with associated songs. Supports both
 * user-created playlists and system-generated therapeutic collections.
 * Automatically handles song creation and playlist-song relationships.
 *
 * @async
 * @function createPlaylist
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body data
 * @param {string} req.body.title - Playlist title (required)
 * @param {string} req.body.description - Playlist description (optional)
 * @param {string} req.body.mood - Therapeutic mood category (required)
 * @param {string} req.body.createdBy - User ID of playlist creator (optional)
 * @param {Array} req.body.tracks - Array of track objects to include (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created playlist
 * @throws {Error} 400 - Missing required fields (title, mood)
 * @throws {Error} 500 - Database creation errors
 *
 * @example
 * POST /api/playlists
 * {
 *   "title": "Morning Meditation",
 *   "description": "Peaceful tracks for morning meditation",
 *   "mood": "relaxing",
 *   "createdBy": "user-uuid-123",
 *   "tracks": [
 *     {
 *       "title": "Peaceful Morning",
 *       "artist": "Nature Sounds",
 *       "duration": 180,
 *       "audioUrl": "https://example.com/track.mp3"
 *     }
 *   ]
 * }
 */
async function createPlaylist(req, res) {
  console.log('➕ Playlists API: POST request received - Creating new playlist');

  const { title, description, mood, createdBy, tracks = [] } = req.body;
  console.log('➕ Playlists API: Playlist data -', {
    title: title || 'not provided',
    description: description ? 'provided' : 'not provided',
    mood: mood || 'not provided',
    createdBy: createdBy ? createdBy.substring(0, 8) + '...' : 'anonymous',
    trackCount: tracks.length
  });

  /**
   * Validate required fields
   *
   * Title and mood are essential for playlist creation as they
   * define the playlist's identity and therapeutic purpose.
   */
  if (!title || !mood) {
    console.log('🚨 Playlists API: Missing required fields');
    return res.status(400).json({
      error: 'Title and mood are required',
      details: 'Both title and mood must be provided to create a playlist',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('➕ Playlists API: Creating playlist in database...');

    /**
     * Create playlist with songs in a single transaction
     *
     * Uses Prisma's nested create to ensure data consistency.
     * Creates the playlist and all associated songs atomically,
     * preventing partial creation scenarios.
     */
    const playlist = await prisma.playlist.create({
      data: {
        title,
        description,
        mood,
        createdBy: createdBy || null,
        verified: false, // New playlists start unverified
        playlistSongs: {
          create: tracks.map((track, index) => ({
            position: index,
            song: {
              create: {
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                audioUrl: track.audioUrl,
                albumArt: track.albumArt || null,
                jamendoId: track.jamendoId || null
              }
            }
          }))
        }
      },
      include: {
        playlistSongs: {
          include: {
            song: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    console.log('✅ Playlists API: Playlist created successfully');
    return res.status(201).json({
      message: 'Playlist created successfully',
      playlist: {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        mood: playlist.mood,
        verified: playlist.verified,
        createdBy: playlist.creator,
        tracks: playlist.playlistSongs.map(ps => ({
          id: ps.song.id,
          title: ps.song.title,
          artist: ps.song.artist,
          duration: ps.song.duration,
          audioUrl: ps.song.audioUrl,
          albumArt: ps.song.albumArt,
          position: ps.position
        })),
        trackCount: playlist.playlistSongs.length,
        createdAt: playlist.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Playlists API: Error creating playlist:', error);
    return res.status(500).json({
      error: 'Failed to create playlist',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * PATCH Request Handler - Update Existing Playlist
 *
 * Supports incremental playlist updates such as adding tracks to
 * user-created playlists.
 *
 * @async
 * @function updatePlaylist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function updatePlaylist(req, res) {
  console.log('✏️ Playlists API: PATCH request received');

  const { action } = req.body || {};

  if (!action) {
    return res.status(400).json({
      error: 'Action is required',
      details: 'Specify an action (e.g., addSong) to update a playlist',
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'addSong') {
    return await handleAddSongToPlaylist(req, res);
  }

  return res.status(400).json({
    error: 'Unsupported action',
    details: `${action} is not supported for playlist updates`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle adding an existing song to a user-created playlist.
 *
 * @async
 * @function handleAddSongToPlaylist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function handleAddSongToPlaylist(req, res) {
  const { playlistId, songId, userId, track } = req.body || {};

  if (!playlistId || !userId) {
    return res.status(400).json({
      error: 'playlistId and userId are required',
      timestamp: new Date().toISOString()
    });
  }

  if (!songId && !track) {
    return res.status(400).json({
      error: 'Song reference missing',
      details: 'Provide an existing songId or track metadata so we can save it.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistSongs: {
          include: { song: true },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        timestamp: new Date().toISOString()
      });
    }

    if (playlist.createdBy !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to edit this playlist',
        timestamp: new Date().toISOString()
      });
    }

    const songRecord = await resolveSongRecord(songId, track);

    if (!songRecord) {
      return res.status(404).json({
        error: 'Song not found',
        details: 'Unable to locate or create this song.',
        timestamp: new Date().toISOString()
      });
    }

    const resolvedSongId = songRecord.id;

    const existingEntry = await prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId,
          songId: resolvedSongId
        }
      }
    });

    if (existingEntry) {
      return res.status(200).json({
        message: 'Song already in playlist',
        playlist: formatPlaylistResponse(playlist),
        timestamp: new Date().toISOString()
      });
    }

    const lastPosition = playlist.playlistSongs.reduce((max, current) => {
      const position = typeof current.position === 'number' ? current.position : 0;
      return Math.max(max, position);
    }, -1);

    await prisma.playlistSong.create({
      data: {
        playlistId,
        songId: resolvedSongId,
        position: lastPosition + 1
      }
    });

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistSongs: {
          include: { song: true },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Song added to playlist',
      playlist: formatPlaylistResponse(updatedPlaylist),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🚨 Playlists API: Error updating playlist:', error);
    return res.status(500).json({
      error: 'Failed to update playlist',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Ensure a song exists for playlist operations. Attempts to resolve by ID,
 * jamendoId/source ID, or creates a new record from provided metadata.
 *
 * @param {string} songId
 * @param {Object} track
 * @returns {Promise<Object|null>}
 */
async function resolveSongRecord(songId, track) {
  let song = null;

  if (songId) {
    song = await prisma.song.findUnique({ where: { id: songId } });
  }

  const jamendoHint = track?.jamendoId || track?.id || null;

  if (!song && jamendoHint) {
    song = await prisma.song.findUnique({ where: { jamendoId: jamendoHint } });
  }

  if (!song && track) {
    const durationValue = typeof track.duration === 'number'
      ? track.duration
      : Number(track.duration) || 0;

    const newSongData = {
      title: track.title || 'Untitled Track',
      artist: track.artist || 'Unknown Artist',
      duration: durationValue,
      audioUrl: track.audioUrl || '',
      albumArt: track.albumArt || null,
      jamendoId: jamendoHint || null
    };

    if (jamendoHint) {
      newSongData.id = jamendoHint;
    }

    song = await prisma.song.create({ data: newSongData });
  }

  return song;
}

/**
 * Handle removing a song from a user-owned playlist.
 *
 * @async
 * @function handleRemoveSongFromPlaylist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function handleRemoveSongFromPlaylist(req, res) {
  const { playlistId, songId, userId } = req.body || {};

  if (!playlistId || !songId || !userId) {
    return res.status(400).json({
      error: 'playlistId, songId, and userId are required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistSongs: {
          include: { song: true },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        timestamp: new Date().toISOString()
      });
    }

    if (playlist.createdBy !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to edit this playlist',
        timestamp: new Date().toISOString()
      });
    }

    const existingEntry = await prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId,
          songId
        }
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        error: 'Song not found in playlist',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: {
          playlistId,
          songId
        }
      }
    });

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistSongs: {
          include: { song: true },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Song removed from playlist',
      playlist: formatPlaylistResponse(updatedPlaylist),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🚨 Playlists API: Error removing playlist song:', error);
    return res.status(500).json({
      error: 'Failed to remove song from playlist',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * DELETE Request Handler - Remove Playlist
 *
 * Permanently deletes a playlist and all its associated relationships.
 * This operation cascades to remove playlist-song relationships but
 * preserves the individual songs for use in other playlists.
 *
 * @async
 * @function deletePlaylist
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.id - Playlist ID to delete (required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming deletion
 * @throws {Error} 400 - Missing playlist ID
 * @throws {Error} 404 - Playlist not found (handled by Prisma)
 * @throws {Error} 500 - Database deletion errors
 *
 * @example
 * DELETE /api/playlists?id=playlist-uuid-123
 */
async function deletePlaylist(req, res) {
  console.log('🗑️ Playlists API: DELETE request received');

  const { id } = req.query;
  console.log('🗑️ Playlists API: Playlist ID -', {
    id: id ? id.substring(0, 8) + '...' : 'not provided'
  });

  /**
   * Validate required parameters
   *
   * Playlist ID is required to identify which playlist to delete.
   * Without it, we cannot perform the deletion safely.
   */
  if (!id) {
    console.log('🚨 Playlists API: Missing required playlist ID');
    return res.status(400).json({
      error: 'Playlist ID is required',
      details: 'Provide playlist ID in query parameter to delete playlist',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🗑️ Playlists API: Deleting playlist from database...');

    /**
     * Delete playlist and cascade relationships
     *
     * Prisma automatically handles the cascade deletion of playlist-song
     * relationships. Individual songs are preserved for use in other playlists.
     */
    await prisma.playlist.delete({
      where: { id }
    });

    console.log('✅ Playlists API: Playlist deleted successfully');
    return res.status(200).json({
      message: 'Playlist deleted successfully',
      deletedId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Playlists API: Error deleting playlist:', error);

    /**
     * Handle specific Prisma errors
     *
     * P2025: Record not found - playlist with provided ID doesn't exist
     */
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Playlist not found',
        details: 'No playlist exists with the provided ID',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Failed to delete playlist',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Normalize playlist response shape for frontend consumption.
 *
 * @param {Object} playlist - Playlist with songs/creator relations
 * @returns {Object|null} Formatted playlist payload
 */
function formatPlaylistResponse(playlist) {
  if (!playlist) return null;

  const sortedSongs = [...(playlist.playlistSongs || [])].sort((a, b) => a.position - b.position);

  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    mood: playlist.mood,
    verified: playlist.verified,
    coverImage: playlist.coverImage,
    createdBy: playlist.createdBy,
    creator: playlist.creator,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    trackCount: sortedSongs.length,
    tracks: sortedSongs.map(entry => ({
      id: entry.song.id,
      title: entry.song.title,
      artist: entry.song.artist,
      duration: entry.song.duration,
      audioUrl: entry.song.audioUrl,
      albumArt: entry.song.albumArt,
      position: entry.position
    }))
  };
}

/**
 * Main API Handler - Playlist Operations Router
 *
 * Central request router for all playlist-related operations. Handles CORS,
 * request validation, and delegates to specialized handler functions based
 * on HTTP method. Provides comprehensive error handling and logging.
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, DELETE, OPTIONS)
 * @param {Object} req.query - Query parameters for GET/DELETE requests
 * @param {Object} req.body - Request body for POST requests
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response from delegated handler
 * @throws {Error} 405 - Unsupported HTTP method
 * @throws {Error} 500 - Database configuration or unhandled errors
 *
 * @example
 * // Health check
 * GET /api/playlists?test=true
 *
 * // Get playlists
 * GET /api/playlists?mood=relaxing
 *
 * // Create playlist
 * POST /api/playlists { "title": "My Playlist", "mood": "energizing" }
 *
 * // Delete playlist
 * DELETE /api/playlists?id=playlist-uuid-123
 */
export default async function handler(req, res) {
  console.log('🎵 Playlists API: Request received -', req.method);

  /**
   * CORS Configuration
   *
   * Enables cross-origin requests from frontend applications.
   * Essential for API access from different domains/ports during development.
   *
   * Note: Enhanced CORS headers for Vercel compatibility
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  /**
   * Handle preflight OPTIONS requests
   *
   * Browsers send OPTIONS requests before actual requests to check CORS permissions.
   * We respond with 200 OK to allow the subsequent actual request.
   */
  if (req.method === 'OPTIONS') {
    console.log('🎵 Playlists API: CORS preflight request handled');
    return res.status(200).end();
  }

  // Ensure consistent JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    /**
     * Database connectivity validation
     *
     * Ensures database is properly configured before processing requests.
     * Prevents cryptic errors by failing fast with clear error messages.
     */
    if (!process.env.DATABASE_URL) {
      console.error('🚨 Playlists API: Database not configured');
      return res.status(500).json({
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Health check endpoint
     *
     * Quick connectivity test for monitoring and deployment verification.
     * Bypasses full request processing for faster response times.
     */
    if (req.query.test === 'true') {
      try {
        console.log('🎵 Playlists API: Testing database connection...');
        await prisma.$connect();
        console.log('✅ Playlists API: Database connection successful');
        return res.status(200).json({
          message: 'Playlists API is working',
          timestamp: new Date().toISOString(),
          database: 'Connected to PostgreSQL via Prisma',
          status: 'healthy'
        });
      } catch (error) {
        console.error('🚨 Playlists API: Database connection failed:', error);
        return res.status(500).json({
          error: 'Failed to connect to database',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    /**
     * Route requests to specialized handler functions
     *
     * Each HTTP method is handled by a dedicated function for better
     * code organization, testing, and maintenance.
     */
    if (req.method === 'GET') {
      return await getPlaylists(req, res);
    }

    if (req.method === 'POST') {
      const action = req.body?.action || req.query?.action;
      if (action === 'addSong') {
        return await handleAddSongToPlaylist(req, res);
      }
      if (action === 'removeSong') {
        return await handleRemoveSongFromPlaylist(req, res);
      }
      return await createPlaylist(req, res);
    }

    if (req.method === 'PATCH') {
      return await updatePlaylist(req, res);
    }

    if (req.method === 'DELETE') {
      return await deletePlaylist(req, res);
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Returns 405 Method Not Allowed for any HTTP methods not explicitly
     * handled above (PUT, PATCH, etc.). This provides clear feedback
     * about which operations are supported by this endpoint.
     */
    console.log('🚨 Playlists API: Unsupported method -', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      details: `${req.method} method is not supported. Use GET, POST, PATCH, or DELETE.`,
      supportedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    /**
     * Global error handler
     *
     * Catches any unhandled errors that occur during request processing.
     * This serves as a safety net to ensure the API always returns a
     * proper JSON response even when unexpected errors occur.
     */
    console.error('🚨 Playlists API: Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Populate database with therapeutic playlists from Jamendo
 *
 * This function fetches curated therapeutic music playlists from the Jamendo API
 * and populates the database with mood-based playlists for music therapy.
 *
 * @async
 * @function populatePlaylists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with population results
 * @throws {Error} Database or API errors during population
 *
 * @example
 * // Populate database with Jamendo playlists
 * GET /api/playlists?populate=true
 *
 * // Response:
 * {
 *   "message": "Playlists populated successfully",
 *   "count": 5,
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 */
async function populatePlaylists(req, res) {
  try {
    console.log('🎵 Playlists API: Starting database population with Jamendo playlists');

    /**
     * Attempt to fetch therapeutic playlists from Jamendo API
     *
     * This calls the external Jamendo service to get curated playlists
     * organized by therapeutic moods (relaxing, focus, sleep, etc.)
     */
    let playlistsData;
    try {
      playlistsData = await getTherapeuticPlaylists();
      const totalTracks = playlistsData.reduce((sum, p) => sum + (p.tracks?.length || 0), 0);

      if (totalTracks === 0) {
        console.warn('🚨 Playlists API: Jamendo returned 0 tracks');
        return res.status(500).json({
          error: 'No tracks found from Jamendo API',
          details: 'Jamendo API returned empty results. Please check your API credentials and try again.',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`✅ Playlists API: Successfully fetched ${totalTracks} tracks from Jamendo`);
      }
    } catch (error) {
      console.error('🚨 Playlists API: Jamendo API error:', error.message);
      return res.status(500).json({
        error: 'Failed to fetch playlists from Jamendo',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Clear existing playlists before population
     *
     * This ensures a clean slate for the new therapeutic playlists.
     * Remove these lines if you want to keep existing user-created playlists.
     */
    console.log('🔄 Playlists API: Clearing existing playlists for fresh population');
    await prisma.playlistSong.deleteMany({});
    await prisma.song.deleteMany({});
    await prisma.playlist.deleteMany({});

    console.log('➕ Playlists API: Creating playlists in database');
    console.log('🎵 Playlists API: Playlist data received:', playlistsData.map(p => ({
      title: p.title,
      trackCount: p.tracks?.length || 0
    })));

    const createdPlaylists = [];

    /**
     * Process each playlist from Jamendo
     *
     * For each playlist, we:
     * 1. Validate it has tracks
     * 2. Create/upsert songs to avoid duplicates
     * 3. Create playlist with song relationships
     * 4. Generate mood-based cover images
     */
    for (const playlistData of playlistsData) {
      console.log(`🔄 Playlists API: Processing playlist: ${playlistData.title} with ${playlistData.tracks?.length || 0} tracks`);

      if (!playlistData.tracks || playlistData.tracks.length === 0) {
        console.warn(`⚠️ Playlists API: No tracks found for ${playlistData.title}, skipping`);
        continue;
      }

      // First, create or find all songs to avoid duplicates across playlists
      const songIds = [];
      for (const track of playlistData.tracks) {
        const song = await prisma.song.upsert({
          where: {
            jamendoId: track.jamendoId || `temp-${Date.now()}-${Math.random()}`
          },
          update: {}, // Don't update existing songs
          create: {
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            audioUrl: track.audioUrl,
            albumArt: track.albumArt || null,
            jamendoId: track.jamendoId || null
          }
        });
        songIds.push(song.id);
      }

      // Create the playlist with relationships to existing songs
      const playlist = await prisma.playlist.create({
        data: {
          title: playlistData.title,
          description: playlistData.description,
          mood: playlistData.mood,
          verified: true, // Mark Jamendo playlists as verified/curated
          coverImage: `https://via.placeholder.com/400x400/${getMoodColor(playlistData.mood)}/ffffff?text=${encodeURIComponent(playlistData.title)}`,
          playlistSongs: {
            create: songIds.map((songId, index) => ({
              position: index,
              songId: songId
            }))
          }
        },
        include: {
          playlistSongs: {
            include: {
              song: true
            }
          }
        }
      });

      createdPlaylists.push(playlist);
      console.log(`✅ Playlists API: Created playlist: ${playlist.title} with ${playlist.playlistSongs.length} tracks`);
    }

    console.log(`🎉 Playlists API: Successfully populated database with ${createdPlaylists.length} therapeutic playlists`);

    return res.status(200).json({
      message: 'Playlists populated successfully',
      count: createdPlaylists.length,
      playlists: createdPlaylists.map(p => ({
        id: p.id,
        title: p.title,
        mood: p.mood,
        trackCount: p.playlistSongs.length
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Playlists API: Error populating playlists:', error);
    return res.status(500).json({
      error: 'Failed to populate playlists',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get mood-based color for playlist covers
 *
 * Returns hex color codes for different therapeutic moods to create
 * visually consistent and mood-appropriate playlist covers.
 *
 * @function getMoodColor
 * @param {string} mood - The mood category (anxiety, focus, sleep, etc.)
 * @returns {string} Hex color code without # prefix
 *
 * @example
 * getMoodColor('anxiety') // Returns '667eea'
 * getMoodColor('focus')   // Returns 'f093fb'
 * getMoodColor('unknown') // Returns '4a90e2' (default)
 */
function getMoodColor(mood) {
  const colors = {
    anxiety: '667eea',      // Calming purple-blue
    focus: 'f093fb',        // Energizing pink-purple
    sleep: '4facfe',        // Soothing light blue
    relaxation: '43e97b',   // Peaceful green
    energy: 'fa709a'        // Vibrant pink
  };
  return colors[mood] || '4a90e2'; // Default blue if mood not found
}

/**
 * Generate Playlist Cover URL
 *
 * Creates a placeholder image URL for playlist covers based on mood.
 *
 * @function generatePlaylistCoverUrl
 * @param {string} mood - Mood category for color selection
 * @param {string} [title] - Optional playlist title for text overlay
 * @returns {string} Generated cover image URL
 */
function generatePlaylistCoverUrl(mood, title = '') {
  const color = getMoodColor(mood);
  const text = title ? encodeURIComponent(title) : 'Playlist';
  return `https://via.placeholder.com/400x400/${color}/ffffff?text=${text}`;
}

/**
 * Handle Category-Based Playlist Generation
 *
 * Generates playlists based on user health goals or music genre preferences.
 * Uses the category configuration system to create personalized playlists.
 *
 * @async
 * @function handleCategoryPlaylists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} categoryType - Type of category ('goal' or 'genre')
 * @param {string} categoryKeyRaw - Raw category key from user input
 * @returns {Promise<void>} JSON response with generated playlists
 */
async function handleCategoryPlaylists(req, res, categoryType, categoryKeyRaw) {
  try {
    // Normalize category key and apply aliases
    let categoryKey = normalizeTag(categoryKeyRaw);
    if (categoryType === 'genre') {
      categoryKey = GENRE_ALIASES[categoryKey] || categoryKey;
    }

    const categoryConfig = CATEGORY_CONFIG[categoryType]?.[categoryKey];
    if (!categoryConfig) {
      return res.status(400).json({
        error: `Unknown ${categoryType}: ${categoryKeyRaw}`,
        availableOptions: Object.keys(CATEGORY_CONFIG[categoryType] || {})
      });
    }

    console.log(`🎵 Generating playlists for ${categoryType}:${categoryKey}`);

    // Generate category-based playlists
    const playlists = await fetchCategoryPlaylists({
      categoryType,
      categoryKey,
      minPlaylists: DEFAULT_PLAYLIST_LIMIT,
      tracksPerPlaylist: TRACKS_PER_PLAYLIST
    });

    // Transform playlists for frontend
    const timestamp = Date.now();
    const formattedPlaylists = playlists.map((playlist, index) => ({
      id: `${categoryType}-${categoryKey}-${timestamp}-${index}`,
      title: playlist.title,
      description: playlist.description,
      mood: playlist.mood,
      category: playlist.category,
      categoryKey: playlist.categoryKey,
      verified: false,
      coverImage: generatePlaylistCoverUrl(playlist.mood),
      tracks: playlist.tracks.map((track, index) => ({
        id: track.jamendoId,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        audioUrl: track.audioUrl,
        albumArt: track.albumArt,
        position: index
      })),
      trackCount: playlist.tracks.length,
      createdAt: new Date().toISOString()
    }));

    return res.status(200).json({
      playlists: formattedPlaylists,
      count: formattedPlaylists.length,
      category: {
        type: categoryType,
        key: categoryKey,
        config: categoryConfig
      }
    });
  } catch (error) {
    console.error('Error generating category playlists:', error);
    return res.status(500).json({
      error: 'Failed to generate playlists',
      details: error.message
    });
  }
}

/**
 * Normalize Tag
 *
 * Normalizes user input tags to lowercase with underscores.
 *
 * @function normalizeTag
 * @param {string} tag - Raw tag input
 * @returns {string} Normalized tag
 */
function normalizeTag(tag) {
  return tag.toLowerCase().replace(/\s+/g, '_');
}

/**
 * API Configuration for Vercel/Next.js
 *
 * Configures the API endpoint behavior including request body parsing limits.
 * The 1MB limit is sufficient for playlist data with multiple tracks while preventing abuse.
 *
 * @type {Object}
 * @property {Object} api - API-specific configuration
 * @property {Object} api.bodyParser - Body parser configuration
 * @property {string} api.bodyParser.sizeLimit - Maximum request body size
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size to prevent abuse
    },
  },
};

