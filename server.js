require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ACCESS_KEYWORD = process.env.ACCESS_KEYWORD || 'demo123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';
const SESSION_TIMEOUT_MINUTES = 30;

// Validate required environment variables
if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable is required!');
    process.exit(1);
}

// Helper functions
function verifyKeyword(keyword) {
    return keyword === ACCESS_KEYWORD;
}

function isGeminiApiKey(input) {
    const trimmed = input.trim();
    // Gemini API keys start with "AIzaSy" and are 39 characters long
    return trimmed.startsWith('AIzaSy') && trimmed.length === 39;
}

// Middleware
app.use(express.json({ limit: '50mb' }));

// Session middleware - handles all session management automatically
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Changed to true to ensure session is created
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: SESSION_TIMEOUT_MINUTES * 60 * 1000,
        sameSite: 'strict' // Same origin, use strict
    }
}));

// Serve Vite build in production, proxy in development
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
}

// API Routes

// Validate keyword/API key
app.post('/api/auth/validate', (req, res) => {
    const { keyword } = req.body;

    if (!keyword) {
        return res.status(400).json({
            success: false,
            error: 'input_required',
            message: 'Access keyword or API key is required'
        });
    }

    // Check if input is a Gemini API key
    if (isGeminiApiKey(keyword)) {
        console.log('[AUTH] Gemini API key detected - client-side mode');
        // Mark session as using own API key
        req.session.authType = 'api_key';
        req.session.authenticated = true;
        return res.json({
            success: true,
            auth_type: 'api_key',
            message: 'Using your own API key'
        });
    }

    // Otherwise, treat as keyword for backend proxy
    if (!verifyKeyword(keyword)) {
        console.log(`[AUTH] Invalid keyword attempt`);
        return res.status(401).json({
            success: false,
            error: 'invalid_keyword',
            message: 'Invalid access keyword or API key format'
        });
    }

    // Keyword auth - create session
    req.session.authType = 'keyword';
    req.session.authenticated = true;
    console.log(`[AUTH] Keyword auth successful - session created`);

    res.json({
        success: true,
        auth_type: 'keyword',
        message: 'Access granted via instructor key'
    });
});

// Analyze frame (proxy to Gemini API for keyword auth)
app.post('/api/analyze', async (req, res) => {
    const { image_data, perspective_prompt } = req.body;

    // Check if authenticated via session
    if (!req.session.authenticated || req.session.authType !== 'keyword') {
        return res.status(401).json({
            success: false,
            error: 'not_authenticated',
            message: 'Not authenticated. Please validate your access keyword first.'
        });
    }

    // Validate inputs
    if (!image_data || !perspective_prompt) {
        return res.status(400).json({
            success: false,
            error: 'missing_data',
            message: 'Image data and perspective prompt are required'
        });
    }

    try {
        // Call Gemini API (using Gemini 2.5 Flash - best for vision in 2025)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: perspective_prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: image_data
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GEMINI] API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({
                success: false,
                error: 'gemini_api_error',
                message: `Gemini API error: ${response.status}`
            });
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
            const description = result.candidates[0].content.parts[0].text;
            res.json({
                success: true,
                description: description
            });
        } else {
            throw new Error('Unexpected API response format');
        }

    } catch (error) {
        console.error(`[GEMINI] Request failed:`, error);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: `Analysis failed: ${error.message}`
        });
    }
});

// Generate summary (proxy to Gemini API for keyword auth)
app.post('/api/generate-summary', async (req, res) => {
    const { prompt } = req.body;

    // Check if authenticated via session
    if (!req.session.authenticated || req.session.authType !== 'keyword') {
        return res.status(401).json({
            success: false,
            error: 'not_authenticated',
            message: 'Not authenticated. Please validate your access keyword first.'
        });
    }

    // Validate inputs
    if (!prompt) {
        return res.status(400).json({
            success: false,
            error: 'missing_data',
            message: 'Prompt is required'
        });
    }

    try {
        // Call Gemini API for text generation
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.4
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GEMINI] API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({
                success: false,
                error: 'gemini_api_error',
                message: `Gemini API error: ${response.status}`
            });
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
            const text = result.candidates[0].content.parts[0].text;
            res.json({
                success: true,
                text: text
            });
        } else {
            throw new Error('Unexpected API response format');
        }

    } catch (error) {
        console.error(`[GEMINI] Request failed:`, error);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: `Summary generation failed: ${error.message}`
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        authenticated: req.session.authenticated || false,
        authType: req.session.authType || null
    });
});

// Serve React app for all other routes (production only)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Video Analyzer server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Session timeout: ${SESSION_TIMEOUT_MINUTES} minutes`);
    console.log(`Access keyword configured: ${ACCESS_KEYWORD ? 'Yes' : 'No'}`);
    console.log(`Using express-session with HTTP-only cookies`);
});
