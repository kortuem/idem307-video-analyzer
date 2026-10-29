require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Render behind Cloudflare
app.set('trust proxy', 1);

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ACCESS_KEYWORD = process.env.ACCESS_KEYWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_TIMEOUT_MINUTES = 30;

// Refuse known examples and missing credentials; never fall back to shared defaults.
const placeholders = /^(demo123|change-this.*|your_.*)$/i;
if ([GEMINI_API_KEY, ACCESS_KEYWORD, SESSION_SECRET].some(
    value => !value || !value.trim() || placeholders.test(value.trim())
) || SESSION_SECRET.length < 32) {
    throw new Error('Configure GEMINI_API_KEY, ACCESS_KEYWORD and a random SESSION_SECRET of at least 32 characters');
}

// Helper functions
function verifyKeyword(keyword) {
    return keyword === ACCESS_KEYWORD;
}

// Middleware
app.use(express.json({ limit: '50mb' }));

// Session middleware - handles all session management automatically
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
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

    if (typeof keyword !== 'string' || !keyword.trim()) {
        return res.status(400).json({
            success: false,
            error: 'input_required',
            message: 'Access keyword or API key is required'
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
    console.log('[AUTH] Keyword auth successful');

    // Explicitly save session to ensure cookie is sent
    req.session.save((err) => {
        if (err) {
            console.error('[AUTH] Session save error');
            return res.status(500).json({
                success: false,
                error: 'session_error',
                message: 'Failed to create session'
            });
        }
        console.log('[AUTH] Session saved');
        res.json({
            success: true,
            auth_type: 'keyword',
            message: 'Access granted via instructor key'
        });
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: 'POST',
                signal: AbortSignal.timeout(60000),
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY,
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
            console.error(`[GEMINI] API error: ${response.status}`);
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

    } catch {
        console.error('[GEMINI] Request failed');
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Analysis failed. Check server configuration, quota and connection.'
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: 'POST',
                signal: AbortSignal.timeout(60000),
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY,
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
            console.error(`[GEMINI] API error: ${response.status}`);
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

    } catch {
        console.error('[GEMINI] Request failed');
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Summary generation failed. Check server configuration, quota and connection.'
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
app.use((err, req, res, _next) => {
    console.error('Request failed');
    res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) app.listen(PORT, () => {
    console.log(`Video Analyzer server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Session timeout: ${SESSION_TIMEOUT_MINUTES} minutes`);
    console.log(`Access keyword configured: ${ACCESS_KEYWORD ? 'Yes' : 'No'}`);
    console.log(`Using express-session with HTTP-only cookies`);
});

module.exports = app;
