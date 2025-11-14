/**
 * Vercel Serverless Function for Playlists API
 * Handles playlist retrieval and dynamic playlist generation
 */

import { prisma } from '../backend/lib/prisma.js';

// Import the main playlists logic from backend
async function handlePlaylistsRequest(req, res) {
    console.log('🎵 Playlists API: Request received', {
        method: req.method,
        query: req.query,
        url: req.url
    });

    try {
        // Import the backend playlists handler
        const { default: playlistsHandler } = await import('../backend/api/playlists.js');
        
        // Create a mock Express-like request/response for the backend handler
        const mockReq = {
            method: req.method,
            query: req.query,
            body: req.body,
            url: req.url
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    res.status(code).json(data);
                    return mockRes;
                }
            }),
            json: (data) => {
                res.json(data);
                return mockRes;
            }
        };

        // Call the backend handler
        await playlistsHandler(mockReq, mockRes);
        
    } catch (error) {
        console.error('🚨 Playlists API: Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Export the handler for Vercel
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    await handlePlaylistsRequest(req, res);
}
