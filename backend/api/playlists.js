// API endpoint for playlist operations (category aware)
import { prisma } from '../lib/prisma.js';
import { fetchCategoryPlaylists, CATEGORY_CONFIG, GENRE_ALIASES } from '../lib/jamendo.js';

const DEFAULT_PLAYLIST_LIMIT = 3;
const CATEGORY_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const TRACKS_PER_PLAYLIST = 8;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.setHeader('Content-Type', 'application/json');

    try {
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({
                error: 'Database not configured',
                details: 'DATABASE_URL environment variable is missing'
            });
        }

        if (req.method === 'GET') {
            return await handleGetPlaylists(req, res);
        }

        if (req.method === 'POST') {
            return await handleCreatePlaylist(req, res);
        }

        if (req.method === 'DELETE') {
            return await handleDeletePlaylist(req, res);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Playlists API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await prisma.$disconnect();
    }
}

async function handleGetPlaylists(req, res) {
    const {
        populate,
        limit,
        userId,
        firebaseUid,
        email,
        goal,
        genre
    } = req.query;

    if (populate === 'true') {
        return await populatePlaylists(req, res);
    }

    const categoryType = goal ? 'goal' : genre ? 'genre' : null;
    const categoryKeyRaw = goal || genre;

    if (!categoryType || !categoryKeyRaw) {
        return res.status(400).json({
            error: 'Either goal or genre parameter is required'
        });
    }

    let categoryKey = normalizeTag(categoryKeyRaw);
    if (categoryType === 'genre') {
        categoryKey = GENRE_ALIASES[categoryKey] || categoryKey;
    }
    const categoryConfig = CATEGORY_CONFIG[categoryType]?.[categoryKey];

    if (!categoryConfig) {
        return res.status(400).json({
            error: `Unsupported ${categoryType}: ${categoryKeyRaw}`
        });
    }

    const userContext = await resolveUserContext({ userId, firebaseUid, email });
    const take = parseLimit(limit, DEFAULT_PLAYLIST_LIMIT);
    const playlists = await ensureCategoryPlaylists({
        categoryType,
        categoryKey,
        limit: take,
        categoryConfig
    });

    const formatted = playlists.map(formatPlaylistForClient);

    return res.status(200).json({
        playlists: formatted,
        count: formatted.length,
        personalization: {
            user: userContext
                ? {
                    id: userContext.id,
                    healthGoals: userContext.healthGoals,
                    musicPreferences: userContext.musicPreferences
                }
                : null,
            category: categoryType,
            categoryKey,
            seedTags: categoryConfig.tags
        }
    });
}

async function handleCreatePlaylist(req, res) {
    const { title, description, mood, createdBy, tracks = [] } = req.body;

    if (!title || !mood) {
        return res.status(400).json({
            error: 'Title and mood are required'
        });
    }

    try {
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
            include: playlistInclude()
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

async function handleDeletePlaylist(req, res) {
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

async function ensureCategoryPlaylists({ categoryType, categoryKey, limit, categoryConfig }) {
    const now = Date.now();
    const cached = await prisma.playlist.findMany({
        where: {
            category: categoryType,
            categoryKey
        },
        include: playlistInclude(),
        orderBy: [
            { seededAt: 'desc' },
            { updatedAt: 'desc' }
        ],
        take: limit
    });

    const fresh = cached.filter((playlist) => {
        if (!playlist.seededAt) return false;
        return now - playlist.seededAt.getTime() < CATEGORY_TTL_MS;
    });

    if (fresh.length >= limit) {
        return fresh.slice(0, limit);
    }

    const seeded = await seedCategoryPlaylists({
        categoryType,
        categoryKey,
        categoryConfig,
        minPlaylists: Math.max(limit, DEFAULT_PLAYLIST_LIMIT)
    });

    const combined = [...seeded, ...fresh];

    if (combined.length >= limit) {
        return combined.slice(0, limit);
    }

    if (combined.length < limit) {
        const remaining = await prisma.playlist.findMany({
            where: {
                category: categoryType,
                categoryKey,
                NOT: {
                    id: {
                        in: combined.map((p) => p.id)
                    }
                }
            },
            include: playlistInclude(),
            orderBy: [
                { seededAt: 'desc' },
                { updatedAt: 'desc' }
            ],
            take: limit - combined.length
        });
        return [...combined, ...remaining].slice(0, limit);
    }

    return combined.slice(0, limit);
}

async function seedCategoryPlaylists({ categoryType, categoryKey, categoryConfig, minPlaylists }) {
    console.log(`[seed] Refreshing category ${categoryType}:${categoryKey}`);
    let jamendoPlaylists = [];
    try {
        jamendoPlaylists = await fetchCategoryPlaylists({
            categoryType,
            categoryKey,
            minPlaylists,
            tracksPerPlaylist: TRACKS_PER_PLAYLIST
        });
    } catch (error) {
        console.error(`[seed] Jamendo fetch failed for ${categoryType}:${categoryKey}`, error);
    }

    if (!jamendoPlaylists.length) {
        console.warn(`[seed] Jamendo returned no playlists for ${categoryType}:${categoryKey}`);
        return [];
    }

    await prisma.playlist.deleteMany({
        where: {
            category: categoryType,
            categoryKey
        }
    });

    const created = [];
    for (const jamendoPlaylist of jamendoPlaylists) {
        const playlist = await createPlaylistFromTracks({
            categoryType,
            categoryKey,
            playlistData: jamendoPlaylist
        });
        if (playlist) {
            created.push(playlist);
        }
    }

    return created;
}

async function createPlaylistFromTracks({ categoryType, categoryKey, playlistData }) {
    const songs = [];
    for (const track of playlistData.tracks) {
        try {
            const song = await prisma.song.upsert({
                where: {
                    jamendoId: track.jamendoId || `temp-${track.title}-${track.artist}`
                },
                update: {
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    audioUrl: track.audioUrl,
                    albumArt: track.albumArt,
                    genreTags: track.genres || []
                },
                create: {
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    audioUrl: track.audioUrl,
                    albumArt: track.albumArt,
                    jamendoId: track.jamendoId,
                    genreTags: track.genres || []
                }
            });
            songs.push(song);
        } catch (error) {
            console.error('[seed] Failed to upsert song', track.title, error);
        }
    }

    if (!songs.length) {
        return null;
    }

    const playlist = await prisma.playlist.create({
        data: {
            title: playlistData.title,
            description: playlistData.description,
            mood: playlistData.mood,
            verified: true,
            coverImage: playlistData.tracks[0]?.albumArt || `https://via.placeholder.com/400x400/${getCoverColor(playlistData.mood)}/ffffff?text=${encodeURIComponent(playlistData.title)}`,
            category: categoryType,
            categoryKey,
            seedTags: playlistData.tags,
            seededAt: new Date(),
            playlistSongs: {
                create: songs.map((song, index) => ({
                    position: index,
                    song: {
                        connect: {
                            id: song.id
                        }
                    }
                }))
            }
        },
        include: playlistInclude()
    });

    console.log(`[seed] Created playlist ${playlist.title} for ${categoryType}:${categoryKey}`);
    return playlist;
}

function formatPlaylistForClient(playlist) {
    return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        mood: playlist.mood,
        verified: playlist.verified,
        coverImage: playlist.coverImage,
        createdBy: playlist.creator,
        genres: playlist.playlistSongs.flatMap(ps => ps.song.genreTags || []),
        tracks: playlist.playlistSongs.map(ps => ({
            id: ps.song.id,
            title: ps.song.title,
            artist: ps.song.artist,
            duration: ps.song.duration,
            audioUrl: ps.song.audioUrl,
            albumArt: ps.song.albumArt,
            position: ps.position,
            genres: ps.song.genreTags
        })),
        trackCount: playlist.playlistSongs.length,
        createdAt: playlist.createdAt,
        personalization: {
            category: playlist.category,
            categoryKey: playlist.categoryKey,
            seedTags: playlist.seedTags,
            seededAt: playlist.seededAt
        }
    };
}

/**
 * Populate database with therapeutic playlists from Jamendo
 */
async function populatePlaylists(req, res) {
    try {
        const categories = [];
        Object.entries(CATEGORY_CONFIG).forEach(([category, entries]) => {
            Object.keys(entries).forEach((key) => {
                categories.push({ categoryType: category, categoryKey: key });
            });
        });

        const seeded = [];
        for (const { categoryType, categoryKey } of categories) {
            const config = CATEGORY_CONFIG[categoryType][categoryKey];
            const created = await seedCategoryPlaylists({
                categoryType,
                categoryKey,
                categoryConfig: config,
                minPlaylists: DEFAULT_PLAYLIST_LIMIT
            });
            seeded.push({
                categoryType,
                categoryKey,
                count: created.length
            });
        }

        return res.status(200).json({
            message: 'Category playlists refreshed from Jamendo',
            categories: seeded
        });
    } catch (error) {
        console.error('Error populating playlists:', error);
        return res.status(500).json({
            error: 'Failed to populate playlists',
            details: error.message
        });
    }
}

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

async function resolveUserContext({ userId, firebaseUid, email }) {
    const clauses = [];
    if (userId) clauses.push({ id: userId });
    if (firebaseUid) clauses.push({ firebaseUid });
    if (email) clauses.push({ email });

    if (clauses.length === 0) {
        return null;
    }

    return prisma.user.findFirst({
        where: {
            OR: clauses
        },
        select: {
            id: true,
            healthGoals: true,
            musicPreferences: true
        }
    });
}

function parseLimit(limit, fallback = DEFAULT_PLAYLIST_LIMIT) {
    if (!limit) return fallback;
    const parsed = Number(limit);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, 12);
}

function normalizeTag(value) {
    return (value || '').toString().trim().toLowerCase();
}

function playlistInclude() {
    return {
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
    };
}

