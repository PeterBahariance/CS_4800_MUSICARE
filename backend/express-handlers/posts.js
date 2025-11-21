/**
 * @fileoverview Playlist Posts / Friends Feed API
 *
 * Enables users to share their custom playlists with optional captions
 * and exposes a feed that aggregates posts from the user and their friends.
 */

import { prisma } from '../lib/prisma.js';

const MAX_CAPTION_LENGTH = 280;
const DEFAULT_FEED_LIMIT = 20;

/**
 * Fetch IDs for the user and all confirmed friends.
 *
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
async function getFriendIds(userId) {
    const friendships = await prisma.friend.findMany({
        where: {
            OR: [
                { userId },
                { friendId: userId }
            ]
        },
        select: {
            userId: true,
            friendId: true
        }
    });

    const ids = new Set([userId]);
    friendships.forEach(entry => {
        if (entry.userId === userId) {
            ids.add(entry.friendId);
        } else {
            ids.add(entry.userId);
        }
    });

    return Array.from(ids);
}

/**
 * Format playlist data for frontend consumption.
 *
 * @param {Object} playlist
 * @returns {Object|null}
 */
function formatPlaylist(playlist) {
    if (!playlist) return null;

    const sortedSongs = [...(playlist.playlistSongs || [])].sort((a, b) => a.position - b.position);

    let coverImage = playlist.coverImage;
    if (!coverImage || coverImage.includes('placeholder.com')) {
        const firstSong = sortedSongs[0]?.song;
        coverImage = firstSong?.albumArt || coverImage || null;
    }

    return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        mood: playlist.mood,
        coverImage,
        verified: playlist.verified,
        creator: playlist.creator ? {
            id: playlist.creator.id,
            displayName: playlist.creator.displayName,
            username: playlist.creator.username
        } : null,
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
 * Format playlist post for API response.
 *
 * @param {Object} post
 * @returns {Object}
 */
function formatPost(post) {
    return {
        id: post.id,
        caption: post.caption,
        createdAt: post.createdAt,
        playlistId: post.playlist?.id || post.playlistId,
        playlist: formatPlaylist(post.playlist),
        author: post.author ? {
            id: post.author.id,
            displayName: post.author.displayName,
            username: post.author.username
        } : null
    };
}

/**
 * GET /api/posts - Fetch feed for user & friends.
 */
async function handleGetPosts(req, res) {
    const { userId, limit } = req.query;

    if (!userId) {
        return res.status(400).json({
            error: 'userId is required',
            details: 'Provide userId query parameter to fetch friend posts'
        });
    }

    const numericLimit = Math.min(
        Math.max(parseInt(limit, 10) || DEFAULT_FEED_LIMIT, 1),
        50
    );

    const authorIds = await getFriendIds(userId);

    const posts = await prisma.playlistPost.findMany({
        where: {
            authorId: {
                in: authorIds
            }
        },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    username: true
                }
            },
            playlist: {
                include: {
                    playlistSongs: {
                        include: { song: true },
                        orderBy: { position: 'asc' }
                    },
                    creator: {
                        select: {
                            id: true,
                            displayName: true,
                            username: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: numericLimit
    });

    return res.status(200).json({
        posts: posts.map(formatPost),
        count: posts.length
    });
}

/**
 * POST /api/posts - Create a playlist post.
 */
async function handleCreatePost(req, res) {
    const { userId, playlistId, caption = '' } = req.body || {};

    if (!userId || !playlistId) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'userId and playlistId are required to create a post'
        });
    }

    const trimmedCaption = caption.trim().slice(0, MAX_CAPTION_LENGTH) || null;

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
                    displayName: true,
                    username: true
                }
            }
        }
    });

    if (!playlist) {
        return res.status(404).json({
            error: 'Playlist not found'
        });
    }

    if (playlist.createdBy !== userId) {
        return res.status(403).json({
            error: 'You can only post playlists you created'
        });
    }

    const post = await prisma.playlistPost.create({
        data: {
            authorId: userId,
            playlistId,
            caption: trimmedCaption
        },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    username: true
                }
            },
            playlist: {
                include: {
                    playlistSongs: {
                        include: { song: true },
                        orderBy: { position: 'asc' }
                    },
                    creator: {
                        select: {
                            id: true,
                            displayName: true,
                            username: true
                        }
                    }
                }
            }
        }
    });

    return res.status(201).json({
        message: 'Playlist shared successfully',
        post: formatPost(post)
    });
}

/**
 * DELETE /api/posts - Remove a playlist post.
 */
async function handleDeletePost(req, res) {
    const { userId, playlistId, postId } = req.body || {};

    if (!userId) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'userId is required to delete a post'
        });
    }

    if (!postId && !playlistId) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'Provide either postId or playlistId to delete a post'
        });
    }

    const whereClause = postId
        ? { id: postId, authorId: userId }
        : { playlistId, authorId: userId };

    const existing = await prisma.playlistPost.findFirst({
        where: whereClause
    });

    if (!existing) {
        return res.status(404).json({
            error: 'Post not found',
            details: 'No post found for given parameters'
        });
    }

    await prisma.playlistPost.delete({
        where: { id: existing.id }
    });

    return res.status(200).json({
        message: 'Post deleted'
    });
}

/**
 * Main request handler
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.setHeader('Content-Type', 'application/json');

    if (!process.env.DATABASE_URL) {
        return res.status(500).json({
            error: 'Database not configured',
            details: 'Missing DATABASE_URL environment variable'
        });
    }

    try {
        if (req.method === 'GET') {
            return await handleGetPosts(req, res);
        }

        if (req.method === 'POST') {
            return await handleCreatePost(req, res);
        }

        if (req.method === 'DELETE') {
            return await handleDeletePost(req, res);
        }

        return res.status(405).json({
            error: 'Method not allowed',
            supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS']
        });
    } catch (error) {
        console.error('Friends Posts API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

