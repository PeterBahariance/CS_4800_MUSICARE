/**
 * @fileoverview Post Comments API Handler
 *
 * Handles CRUD operations for post comments in the Musicare application.
 * Allows users to comment on playlist posts, view comments, and delete their own comments.
 *
 * Endpoints:
 * - GET /api/comments?postId=... - Retrieve all comments for a post
 * - POST /api/comments - Create a new comment
 * - DELETE /api/comments?commentId=... - Delete a comment (author only)
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-30
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all comments for a specific post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleGetComments(req, res) {
    const { postId } = req.query;

    if (!postId) {
        return res.status(400).json({
            error: 'Post ID is required',
            details: 'Please provide a postId query parameter'
        });
    }

    try {
        const comments = await prisma.postComment.findMany({
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
            orderBy: { createdAt: 'asc' }
        });

        return res.status(200).json({
            comments,
            count: comments.length
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({
            error: 'Failed to fetch comments',
            details: error.message
        });
    }
}

/**
 * Create a new comment on a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleCreateComment(req, res) {
    const { userId, postId, content } = req.body;

    if (!userId || !postId || !content) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'userId, postId, and content are required'
        });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid content',
            details: 'Comment content must be a non-empty string'
        });
    }

    if (content.length > 500) {
        return res.status(400).json({
            error: 'Content too long',
            details: 'Comment must be 500 characters or less'
        });
    }

    try {
        const comment = await prisma.postComment.create({
            data: {
                userId,
                postId,
                content: content.trim()
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

        return res.status(201).json({
            message: 'Comment created successfully',
            comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        
        if (error.code === 'P2003') {
            return res.status(404).json({
                error: 'Post or user not found',
                details: 'The specified post or user does not exist'
            });
        }

        return res.status(500).json({
            error: 'Failed to create comment',
            details: error.message
        });
    }
}

/**
 * Delete a comment (author only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleDeleteComment(req, res) {
    const { commentId, userId } = req.query;

    if (!commentId || !userId) {
        return res.status(400).json({
            error: 'Missing required parameters',
            details: 'commentId and userId are required'
        });
    }

    try {
        // First, check if the comment exists and belongs to the user
        const comment = await prisma.postComment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({
                error: 'Comment not found'
            });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                error: 'Unauthorized',
                details: 'You can only delete your own comments'
            });
        }

        await prisma.postComment.delete({
            where: { id: commentId }
        });

        return res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({
            error: 'Failed to delete comment',
            details: error.message
        });
    }
}

/**
 * Main handler for comments API
 * Routes requests to appropriate handler based on HTTP method
 */
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            return await handleGetComments(req, res);
        }

        if (req.method === 'POST') {
            return await handleCreateComment(req, res);
        }

        if (req.method === 'DELETE') {
            return await handleDeleteComment(req, res);
        }

        return res.status(405).json({
            error: 'Method not allowed',
            details: `${req.method} method is not supported`,
            supportedMethods: ['GET', 'POST', 'DELETE']
        });
    } catch (error) {
        console.error('Comments API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}

