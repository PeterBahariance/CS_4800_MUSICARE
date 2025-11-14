/**
 * Vercel Serverless Function for Library API
 * Handles user library operations (saved playlists and songs)
 */

import { prisma } from '../backend/lib/prisma.js';

// Import the main library logic from backend
async function handleLibraryRequest(req, res) {
    console.log('📚 Library API: Request received (v2)', {
        method: req.method,
        query: req.query,
        url: req.url
    });

    try {
        // Import the backend library handler
        const { default: libraryHandler } = await import('../backend/api/library.js');
        
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
            },
            setHeader: (name, value) => {
                res.setHeader(name, value);
                return mockRes;
            }
        };

        // Call the backend handler
        await libraryHandler(mockReq, mockRes);
        
    } catch (error) {
        console.error('🚨 Library API: Error:', error);
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

    await handleLibraryRequest(req, res);
}
