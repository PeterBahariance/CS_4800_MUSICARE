/**
 * @fileoverview User Library Management API Endpoint
 *
 * This module handles user library operations for the Musicare application.
 * It provides functionality for users to save/remove playlists and songs
 * to their personal library, supporting the wellness-focused music experience.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 *
 * @requires prisma - Database ORM for PostgreSQL operations
 *
 * @example
 * // GET /api/library?userId=123 - Retrieve user's saved library
 * // POST /api/library - Save playlist or song to library
 * // DELETE /api/library?userId=123&itemId=456&itemType=playlist - Remove item from library
 */

import { prisma } from '../lib/prisma.js';

/**
 * Supported item types for library operations
 * @constant {string[]}
 */
const SUPPORTED_ITEM_TYPES = ['playlist', 'song'];

/**
 * Main API Handler - Routes requests to appropriate handlers
 *
 * Handles CORS configuration and routes HTTP methods to specific
 * handler functions for library operations.
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response
 */
export default async function handler(req, res) {
    try {
        // Configure CORS headers
        configureCORS(res);

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Validate database configuration
        if (!process.env.DATABASE_URL) {
            return handleError(res, 500, 'Database not configured', 'DATABASE_URL environment variable is missing');
        }

        // Route to appropriate handler based on HTTP method
        switch (req.method) {
            case 'GET':
                return await handleGetLibrary(req, res);
            case 'POST':
                return await handleSaveItem(req, res);
            case 'DELETE':
                return await handleRemoveItem(req, res);
            default:
                return handleError(res, 405, 'Method not allowed');
        }
    } catch (error) {
        console.error('Library API error:', error);
        return handleError(res, 500, 'Internal server error', 
            process.env.NODE_ENV === 'development' ? error.message : undefined);
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Configure CORS Headers
 *
 * Sets up Cross-Origin Resource Sharing headers for API access.
 *
 * @function configureCORS
 * @param {Object} res - Express response object
 */
function configureCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
}

/**
 * Error Response Handler
 *
 * Standardizes error responses across the API.
 *
 * @function handleError
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} [details] - Optional error details
 * @returns {Object} JSON error response
 */
function handleError(res, status, message, details) {
    return res.status(status).json({
        error: message,
        details: details
    });
}

/**
 * GET Request Handler - Retrieve User's Library
 *
 * Fetches all saved playlists and songs for a specific user.
 * Returns formatted data with playlist details and song information.
 *
 * @async
 * @function handleGetLibrary
 * @param {Object} req - Express request object
 * @param {string} req.query.userId - User ID to fetch library for
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with saved playlists and songs
 *
 * @throws {Error} 400 - Missing userId parameter
 * @throws {Error} 500 - Database query error
 */
async function handleGetLibrary(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return handleError(res, 400, 'User ID is required');
    }

    try {
        const [savedPlaylists, savedSongs, userPlaylists, userPosts] = await Promise.all([
            fetchSavedPlaylists(userId),
            fetchSavedSongs(userId),
            fetchUserPlaylists(userId),
            fetchUserPlaylistPosts(userId)
        ]);

        return res.status(200).json({
            savedPlaylists: savedPlaylists.map(entry => ({
                id: entry.id,
                savedAt: entry.createdAt,
                context: entry.context,
                playlist: formatPlaylist(entry.playlist)
            })),
            savedSongs: savedSongs.map(entry => ({
                id: entry.id,
                savedAt: entry.createdAt,
                context: entry.context,
                song: formatSong(entry.song)
            })),
            userPlaylists: userPlaylists.map(playlist => ({
                createdAt: playlist.createdAt,
                updatedAt: playlist.updatedAt,
                playlist: formatPlaylist(playlist)
            })),
            userPlaylistPosts: userPosts.map(post => ({
                id: post.id,
                playlistId: post.playlistId,
                caption: post.caption,
                createdAt: post.createdAt
            }))
        });
    } catch (error) {
        console.error('Error loading library:', error);
        return handleError(res, 500, 'Failed to load library', error.message);
    }
}

/**
 * POST Request Handler - Save Item to Library
 *
 * Saves a playlist or song to the user's personal library.
 * Supports upsert operations to update context if item already exists.
 *
 * @async
 * @function handleSaveItem
 * @param {Object} req - Express request object
 * @param {string} req.body.userId - User ID
 * @param {string} req.body.itemId - Playlist or song ID to save
 * @param {string} req.body.itemType - Type of item ('playlist' or 'song')
 * @param {string} [req.body.context] - Optional context for saving
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with saved item details
 *
 * @throws {Error} 400 - Missing required parameters or invalid itemType
 * @throws {Error} 500 - Database operation error
 */
async function handleSaveItem(req, res) {
    const { userId, itemId, itemType, context } = req.body || {};

    if (!userId || !itemId || !itemType) {
        return handleError(res, 400, 'userId, itemId, and itemType are required');
    }

    if (!SUPPORTED_ITEM_TYPES.includes(itemType)) {
        return handleError(res, 400, 'Invalid itemType');
    }

    try {
        if (itemType === 'playlist') {
            const saved = await savePlaylistToLibrary(userId, itemId, context);
            return res.status(200).json({
                message: 'Playlist saved',
                entry: {
                    id: saved.id,
                    savedAt: saved.createdAt,
                    playlist: formatPlaylist(saved.playlist)
                }
            });
        }

        const saved = await saveSongToLibrary(userId, itemId, context);
        return res.status(200).json({
            message: 'Song saved',
            entry: {
                id: saved.id,
                savedAt: saved.createdAt,
                song: formatSong(saved.song)
            }
        });
    } catch (error) {
        console.error('Error saving library item:', error);
        return handleError(res, 500, 'Failed to save item', error.message);
    }
}

/**
 * DELETE Request Handler - Remove Item from Library
 *
 * Removes a saved playlist or song from the user's personal library.
 *
 * @async
 * @function handleRemoveItem
 * @param {Object} req - Express request object
 * @param {string} req.query.userId - User ID
 * @param {string} req.query.itemId - Playlist or song ID to remove
 * @param {string} req.query.itemType - Type of item ('playlist' or 'song')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming removal
 *
 * @throws {Error} 400 - Missing required parameters or invalid itemType
 * @throws {Error} 500 - Database operation error
 */
async function handleRemoveItem(req, res) {
    const { userId, itemId, itemType } = req.query;

    if (!userId || !itemId || !itemType) {
        return handleError(res, 400, 'userId, itemId, and itemType are required');
    }

    if (!SUPPORTED_ITEM_TYPES.includes(itemType)) {
        return handleError(res, 400, 'Invalid itemType');
    }

    try {
        if (itemType === 'playlist') {
            await removePlaylistFromLibrary(userId, itemId);
            return res.status(200).json({ message: 'Playlist removed' });
        }

        await removeSongFromLibrary(userId, itemId);
        return res.status(200).json({ message: 'Song removed' });
    } catch (error) {
        console.error('Error removing library item:', error);
        return handleError(res, 500, 'Failed to remove item', error.message);
    }
}

// ==================== DATABASE OPERATIONS ====================

/**
 * Fetch Saved Playlists
 *
 * Retrieves all playlists saved by a user with full playlist details.
 *
 * @async
 * @function fetchSavedPlaylists
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved playlist entries
 */
async function fetchSavedPlaylists(userId) {
    return await prisma.userSavedPlaylist.findMany({
        where: { userId },
        include: {
            playlist: {
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
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Fetch Saved Songs
 *
 * Retrieves all songs saved by a user with full song details.
 *
 * @async
 * @function fetchSavedSongs
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved song entries
 */
async function fetchSavedSongs(userId) {
    return await prisma.userSavedSong.findMany({
        where: { userId },
        include: { song: true },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Fetch User-Created Playlists
 *
 * Retrieves playlists the user has created themselves.
 *
 * @async
 * @function fetchUserPlaylists
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of playlist records
 */
async function fetchUserPlaylists(userId) {
    return await prisma.playlist.findMany({
        where: { createdBy: userId },
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
        },
        orderBy: { createdAt: 'desc' }
    });
}

async function fetchUserPlaylistPosts(userId) {
    return await prisma.playlistPost.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Save Playlist to Library
 *
 * Saves or updates a playlist in the user's library using upsert.
 * For dynamic playlists that don't exist in the database, creates them first.
 *
 * @async
 * @function savePlaylistToLibrary
 * @param {string} userId - User ID
 * @param {string} playlistId - Playlist ID to save
 * @param {string} [context] - Optional context for saving
 * @returns {Promise<Object>} Saved playlist entry with details
 */
async function savePlaylistToLibrary(userId, playlistId, context) {
    // Check if playlist exists in database
    const existingPlaylist = await prisma.playlist.findUnique({
        where: { id: playlistId }
    });

    // If playlist doesn't exist and it's a dynamic playlist, create it
    if (!existingPlaylist && (playlistId.startsWith('goal-') || playlistId.startsWith('genre-'))) {
        // For dynamic playlists, we'll create a minimal entry
        // The full playlist data will be generated by the playlists API when needed
        await prisma.playlist.create({
            data: {
                id: playlistId,
                title: 'Dynamic Playlist',
                description: 'Dynamically generated playlist',
                mood: 'relaxation',
                verified: false,
                category: playlistId.startsWith('goal-') ? 'goal' : 'genre',
                categoryKey: playlistId.split('-')[1] || 'unknown'
            }
        });
    }

    return await prisma.userSavedPlaylist.upsert({
        where: {
            userId_playlistId: {
                userId,
                playlistId
            }
        },
        update: {
            context: context || undefined
        },
        create: {
            userId,
            playlistId,
            context: context || null
        },
        include: {
            playlist: {
                include: {
                    playlistSongs: {
                        include: { song: true },
                        orderBy: { position: 'asc' }
                    }
                }
            }
        }
    });
}

/**
 * Save Song to Library
 *
 * Saves or updates a song in the user's library using upsert.
 *
 * @async
 * @function saveSongToLibrary
 * @param {string} userId - User ID
 * @param {string} songId - Song ID to save
 * @param {string} [context] - Optional context for saving
 * @returns {Promise<Object>} Saved song entry with details
 */
async function saveSongToLibrary(userId, songId, context) {
    return await prisma.userSavedSong.upsert({
        where: {
            userId_songId: {
                userId,
                songId
            }
        },
        update: {
            context: context || undefined
        },
        create: {
            userId,
            songId,
            context: context || null
        },
        include: {
            song: true
        }
    });
}

/**
 * Remove Playlist from Library
 *
 * Removes a saved playlist from the user's library.
 *
 * @async
 * @function removePlaylistFromLibrary
 * @param {string} userId - User ID
 * @param {string} playlistId - Playlist ID to remove
 * @returns {Promise<void>}
 */
async function removePlaylistFromLibrary(userId, playlistId) {
    await prisma.userSavedPlaylist.delete({
        where: {
            userId_playlistId: {
                userId,
                playlistId
            }
        }
    });
}

/**
 * Remove Song from Library
 *
 * Removes a saved song from the user's library.
 *
 * @async
 * @function removeSongFromLibrary
 * @param {string} userId - User ID
 * @param {string} songId - Song ID to remove
 * @returns {Promise<void>}
 */
async function removeSongFromLibrary(userId, songId) {
    await prisma.userSavedSong.delete({
        where: {
            userId_songId: {
                userId,
                songId
            }
        }
    });
}

// ==================== FORMATTING UTILITIES ====================

/**
 * Format Playlist Data
 *
 * Transforms raw playlist data into frontend-friendly format.
 *
 * @function formatPlaylist
 * @param {Object} playlist - Raw playlist data from database
 * @returns {Object|null} Formatted playlist object or null
 */
function formatPlaylist(playlist) {
    if (!playlist) return null;

    const sortedSongs = [...(playlist.playlistSongs || [])].sort((a, b) => a.position - b.position);

    // Use first track's album art if playlist cover is a placeholder
    let coverImage = playlist.coverImage;
    if (!coverImage || coverImage.includes('placeholder.com')) {
        const firstSong = sortedSongs[0]?.song;
        coverImage = firstSong?.albumArt || playlist.coverImage;
    }

    return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        mood: playlist.mood,
        coverImage: coverImage,
        verified: playlist.verified,
        ownerId: playlist.createdBy || null,
        creator: playlist.creator ? {
            id: playlist.creator.id,
            username: playlist.creator.username,
            displayName: playlist.creator.displayName
        } : null,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        trackCount: sortedSongs.length,
        previewTracks: sortedSongs.slice(0, 3).map(ps => ({
            ...formatSong(ps.song),
            position: ps.position
        })),
        tracks: sortedSongs.map(ps => ({
            ...formatSong(ps.song),
            position: ps.position
        }))
    };
}

/**
 * Format Song Data
 *
 * Transforms raw song data into frontend-friendly format.
 *
 * @function formatSong
 * @param {Object} song - Raw song data from database
 * @returns {Object|null} Formatted song object or null
 */
function formatSong(song) {
    if (!song) return null;

    return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        audioUrl: song.audioUrl,
        albumArt: song.albumArt
    };
}
