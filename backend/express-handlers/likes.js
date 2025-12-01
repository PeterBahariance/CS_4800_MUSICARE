/**
 * @fileoverview Post Likes API Endpoint
 *
 * Handles liking and unliking playlist posts in the Musicare application.
 * Enables users to show appreciation for friends' shared playlists.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-30
 * @requires ../lib/prisma.js - Database ORM for like operations
 *
 * @example
 * // Like a post
 * POST /api/likes
 * { "userId": "user-123", "postId": "post-456" }
 *
 * // Unlike a post
 * DELETE /api/likes?userId=user-123&postId=post-456
 *
 * // Get likes for a post
 * GET /api/likes?postId=post-456
 */

import { prisma } from '../lib/prisma.js';

/**
 * GET Request Handler - Retrieve Likes for a Post
 *
 * Fetches all likes for a specific post, including user information.
 *
 * @async
 * @function handleGetLikes
 * @param {Object} req - Express request object
 * @param {string} req.query.postId - Post ID to fetch likes for
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with likes data
 */
async function handleGetLikes(req, res) {
    const { postId } = req.query;

    if (!postId) {
        return res.status(400).json({
            error: 'postId is required',
            details: 'Provide postId query parameter to fetch likes'
        });
    }

    try {
        const likes = await prisma.postLike.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            likes,
            count: likes.length
        });
    } catch (error) {
        console.error('Error fetching likes:', error);
        return res.status(500).json({
            error: 'Failed to fetch likes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * POST Request Handler - Like a Post
 *
 * Creates a like for a post. Uses upsert to prevent duplicate likes.
 *
 * @async
 * @function handleLikePost
 * @param {Object} req - Express request object
 * @param {string} req.body.userId - User ID who is liking
 * @param {string} req.body.postId - Post ID to like
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming like
 */
async function handleLikePost(req, res) {
    const { userId, postId } = req.body || {};

    if (!userId || !postId) {
        return res.status(400).json({
            error: 'userId and postId are required',
            details: 'Both userId and postId must be provided to like a post'
        });
    }

    try {
        const like = await prisma.postLike.upsert({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            },
            update: {},
            create: {
                userId,
                postId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        return res.status(200).json({
            message: 'Post liked',
            like
        });
    } catch (error) {
        console.error('Error liking post:', error);
        return res.status(500).json({
            error: 'Failed to like post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * DELETE Request Handler - Unlike a Post
 *
 * Removes a like from a post.
 *
 * @async
 * @function handleUnlikePost
 * @param {Object} req - Express request object
 * @param {string} req.query.userId - User ID who is unliking
 * @param {string} req.query.postId - Post ID to unlike
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming unlike
 */
async function handleUnlikePost(req, res) {
    const { userId, postId } = req.query;

    if (!userId || !postId) {
        return res.status(400).json({
            error: 'userId and postId are required',
            details: 'Both userId and postId must be provided to unlike a post'
        });
    }

    try {
        await prisma.postLike.delete({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        return res.status(200).json({
            message: 'Post unliked'
        });
    } catch (error) {
        // If like doesn't exist, still return success
        if (error.code === 'P2025') {
            return res.status(200).json({
                message: 'Post unliked'
            });
        }

        console.error('Error unliking post:', error);
        return res.status(500).json({
            error: 'Failed to unlike post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Main API Handler - Likes Endpoint
 *
 * Routes requests to appropriate handlers based on HTTP method.
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response
 */
export default async function handler(req, res) {
    // Configure CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Validate database configuration
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({
            error: 'Database not configured',
            details: 'DATABASE_URL environment variable is missing'
        });
    }

    try {
        // Route to appropriate handler based on HTTP method
        if (req.method === 'GET') {
            return await handleGetLikes(req, res);
        }

        if (req.method === 'POST') {
            return await handleLikePost(req, res);
        }

        if (req.method === 'DELETE') {
            return await handleUnlikePost(req, res);
        }

        return res.status(405).json({
            error: 'Method not allowed',
            supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS']
        });
    } catch (error) {
        console.error('Likes API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await prisma.$disconnect();
    }
}

