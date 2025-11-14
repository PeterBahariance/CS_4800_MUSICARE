import { prisma } from '../lib/prisma.js';

const SUPPORTED_ITEM_TYPES = ['playlist', 'song'];

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({
                error: 'Database not configured',
                details: 'DATABASE_URL environment variable is missing'
            });
        }

        if (req.method === 'GET') {
            return await handleGetLibrary(req, res);
        }

        if (req.method === 'POST') {
            return await handleSaveItem(req, res);
        }

        if (req.method === 'DELETE') {
            return await handleRemoveItem(req, res);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Library API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await prisma.$disconnect();
    }
}

async function handleGetLibrary(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [savedPlaylists, savedSongs] = await Promise.all([
            prisma.userSavedPlaylist.findMany({
                where: { userId },
                include: {
                    playlist: {
                        include: {
                            playlistSongs: {
                                include: { song: true },
                                orderBy: { position: 'asc' }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.userSavedSong.findMany({
                where: { userId },
                include: {
                    song: true
                },
                orderBy: { createdAt: 'desc' }
            })
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
            }))
        });
    } catch (error) {
        console.error('Error loading library:', error);
        return res.status(500).json({
            error: 'Failed to load library',
            details: error.message
        });
    }
}

async function handleSaveItem(req, res) {
    const { userId, itemId, itemType, context } = req.body || {};

    if (!userId || !itemId || !itemType) {
        return res.status(400).json({ error: 'userId, itemId, and itemType are required' });
    }

    if (!SUPPORTED_ITEM_TYPES.includes(itemType)) {
        return res.status(400).json({ error: 'Invalid itemType' });
    }

    try {
        if (itemType === 'playlist') {
            const saved = await prisma.userSavedPlaylist.upsert({
                where: {
                    userId_playlistId: {
                        userId,
                        playlistId: itemId
                    }
                },
                update: {
                    context: context || undefined
                },
                create: {
                    userId,
                    playlistId: itemId,
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

            return res.status(200).json({
                message: 'Playlist saved',
                entry: {
                    id: saved.id,
                    savedAt: saved.createdAt,
                    playlist: formatPlaylist(saved.playlist)
                }
            });
        }

        const saved = await prisma.userSavedSong.upsert({
            where: {
                userId_songId: {
                    userId,
                    songId: itemId
                }
            },
            update: {
                context: context || undefined
            },
            create: {
                userId,
                songId: itemId,
                context: context || null
            },
            include: {
                song: true
            }
        });

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
        return res.status(500).json({
            error: 'Failed to save item',
            details: error.message
        });
    }
}

async function handleRemoveItem(req, res) {
    const { userId, itemId, itemType } = req.query;

    if (!userId || !itemId || !itemType) {
        return res.status(400).json({ error: 'userId, itemId, and itemType are required' });
    }

    if (!SUPPORTED_ITEM_TYPES.includes(itemType)) {
        return res.status(400).json({ error: 'Invalid itemType' });
    }

    try {
        if (itemType === 'playlist') {
            await prisma.userSavedPlaylist.delete({
                where: {
                    userId_playlistId: {
                        userId,
                        playlistId: itemId
                    }
                }
            });

            return res.status(200).json({ message: 'Playlist removed' });
        }

        await prisma.userSavedSong.delete({
            where: {
                userId_songId: {
                    userId,
                    songId: itemId
                }
            }
        });

        return res.status(200).json({ message: 'Song removed' });
    } catch (error) {
        console.error('Error removing library item:', error);
        return res.status(500).json({
            error: 'Failed to remove item',
            details: error.message
        });
    }
}

function formatPlaylist(playlist) {
    if (!playlist) return null;
    const sortedSongs = [...(playlist.playlistSongs || [])].sort((a, b) => a.position - b.position);
    return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        mood: playlist.mood,
        coverImage: playlist.coverImage,
        verified: playlist.verified,
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

