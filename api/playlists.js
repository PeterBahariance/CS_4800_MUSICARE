// API endpoint for playlist operations
import { prisma } from '../lib/prisma.js';
import { getTherapeuticPlaylists } from '../lib/jamendo.js';

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

        // GET all playlists
        if (req.method === 'GET') {
            const { mood, populate } = req.query;

            // Special action: Populate database with Jamendo music
            if (populate === 'true') {
                return await populatePlaylists(req, res);
            }

            try {
                // Build query
                const where = mood ? { mood } : {};

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

                // Transform data for frontend
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

                return res.status(200).json({
                    playlists: formattedPlaylists,
                    count: formattedPlaylists.length
                });
            } catch (error) {
                console.error('Error fetching playlists:', error);
                return res.status(500).json({
                    error: 'Failed to fetch playlists',
                    details: error.message
                });
            }
        }

        // POST - Create a new playlist
        if (req.method === 'POST') {
            const { title, description, mood, createdBy, tracks = [] } = req.body;

            if (!title || !mood) {
                return res.status(400).json({
                    error: 'Title and mood are required'
                });
            }

            try {
                // Create playlist with songs
                const playlist = await prisma.playlist.create({
                    data: {
                        title,
                        description,
                        mood,
                        createdBy: createdBy || null,
                        verified: false,
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
                        }
                    }
                });

                return res.status(201).json({
                    message: 'Playlist created successfully',
                    playlist
                });
            } catch (error) {
                console.error('Error creating playlist:', error);
                return res.status(500).json({
                    error: 'Failed to create playlist',
                    details: error.message
                });
            }
        }

        // DELETE - Remove a playlist
        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Playlist ID is required' });
            }

            try {
                await prisma.playlist.delete({
                    where: { id }
                });

                return res.status(200).json({
                    message: 'Playlist deleted successfully'
                });
            } catch (error) {
                console.error('Error deleting playlist:', error);
                return res.status(500).json({
                    error: 'Failed to delete playlist',
                    details: error.message
                });
            }
        }

        // Method not allowed
        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Playlists API Error:', error);
        console.error('Error stack:', error.stack);

        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Populate database with therapeutic playlists from Jamendo
 */
async function populatePlaylists(req, res) {
    try {
        console.log('🎵 Fetching therapeutic playlists from Jamendo...');

        // Try Jamendo with your real API key!
        console.log('🎵 Attempting to fetch from Jamendo API with your credentials...');

        let playlistsData;
        try {
            playlistsData = await getTherapeuticPlaylists();
            const totalTracks = playlistsData.reduce((sum, p) => sum + (p.tracks?.length || 0), 0);

            if (totalTracks === 0) {
                console.warn('Jamendo returned 0 tracks');
                return res.status(500).json({
                    error: 'No tracks found from Jamendo API',
                    details: 'Jamendo API returned empty results. Please check your API credentials and try again.'
                });
            } else {
                console.log(`Successfully fetched ${totalTracks} tracks from Jamendo!`);
            }
        } catch (error) {
            console.error('Jamendo API error:', error.message);
            return res.status(500).json({
                error: 'Failed to fetch playlists from Jamendo',
                details: error.message
            });
        }

        // Clear existing playlists (optional - remove if you want to keep existing)
        console.log('Clearing existing playlists...');
        await prisma.playlistSong.deleteMany({});
        await prisma.song.deleteMany({});
        await prisma.playlist.deleteMany({});

        console.log('Creating playlists in database...');
        console.log('Playlist data received:', playlistsData.map(p => ({
            title: p.title,
            trackCount: p.tracks?.length || 0
        })));

        const createdPlaylists = [];

        for (const playlistData of playlistsData) {
            console.log(`Processing playlist: ${playlistData.title} with ${playlistData.tracks?.length || 0} tracks`);

            if (!playlistData.tracks || playlistData.tracks.length === 0) {
                console.warn(`⚠️  No tracks found for ${playlistData.title}`);
                continue;
            }

            // First, create or find all songs
            const songIds = [];
            for (const track of playlistData.tracks) {
                // Use upsert to handle duplicate songs across playlists
                const song = await prisma.song.upsert({
                    where: {
                        jamendoId: track.jamendoId || `temp-${Date.now()}-${Math.random()}`
                    },
                    update: {},
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

            // Then create the playlist with relationships to existing songs
            const playlist = await prisma.playlist.create({
                data: {
                    title: playlistData.title,
                    description: playlistData.description,
                    mood: playlistData.mood,
                    verified: true,
                    coverImage: `https://via.placeholder.com/400x400/${getCoverColor(playlistData.mood)}/ffffff?text=${encodeURIComponent(playlistData.title)}`,
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
            console.log(`Created playlist: ${playlist.title} with ${playlist.playlistSongs.length} tracks`);
        }

        return res.status(200).json({
            message: 'Playlists populated successfully',
            count: createdPlaylists.length,
            playlists: createdPlaylists.map(p => ({
                id: p.id,
                title: p.title,
                mood: p.mood,
                trackCount: p.playlistSongs.length
            }))
        });
    } catch (error) {
        console.error('Error populating playlists:', error);
        return res.status(500).json({
            error: 'Failed to populate playlists',
            details: error.message
        });
    }
}

/**
 * Get color for playlist cover based on mood
 */
function getCoverColor(mood) {
    const colors = {
        anxiety: '667eea',
        focus: 'f093fb',
        sleep: '4facfe',
        relaxation: '43e97b',
        energy: 'fa709a'
    };
    return colors[mood] || '4a90e2';
}

