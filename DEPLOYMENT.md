# Deployment Guide - Render.com

## Prerequisites

1. **GitHub Repository** - Push your code to GitHub
2. **Gemini API Key** - Get one from [Google AI Studio](https://ai.google.dev/)
3. **Render.com Account** - Sign up at [render.com](https://render.com/)

## Step 1: Prepare Repository

Ensure these files are properly configured:

-  `.env` is in `.gitignore` (secrets not committed)
-  `.env.example` exists with placeholder values
-  `render.yaml` exists with service configuration
-  Internal dev docs are in `.gitignore`

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**  IMPORTANT:** Before pushing, verify that `.env` is NOT tracked:
```bash
git status
# Should NOT show .env in the list
```

## Step 3: Create Render.com Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Click **"New +"** ’ **"Web Service"**
3. Connect your GitHub repository
4. Select your `video-analyzer` repository

## Step 4: Configure Web Service

**Basic Settings:**
- **Name:** `video-analyzer` (or your preferred name)
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Instance Type:** Free or Starter (512MB minimum)

## Step 5: Set Environment Variables

Add these environment variables in the Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Set automatically by render.yaml |
| `PORT` | `3000` | Set automatically by render.yaml |
| `GEMINI_API_KEY` | `YOUR_ACTUAL_API_KEY` |   **REQUIRED** - Get from Google AI Studio |
| `ACCESS_KEYWORD` | `idem307_2025` |   **REQUIRED** - Your student access keyword |
| `SESSION_SECRET` | Generate random |   **REQUIRED** - See below |
| `MAX_CONCURRENT_SESSIONS` | `12` | Optional (default: 12) |

### Generating SESSION_SECRET

On your local machine, run:
```bash
openssl rand -base64 32
```

Copy the output and paste it as the `SESSION_SECRET` value in Render.

**Example output:** `XyZ123abc...` (use the actual output, not this example!)

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start the server with `npm run start`
   - Assign a public URL

**Deployment takes ~3-5 minutes**

## Step 7: Test Your Deployment

Once deployed, you'll get a URL like: `https://video-analyzer-abcd.onrender.com`

1. Visit the URL
2. Upload a test video
3. Enter the access keyword: `idem307_2025`
4. Run an analysis to verify everything works

## Architecture

**Production Setup:**
```
User Browser
    “
Render.com (HTTPS)
    “
Express Server (serving React app + API)
    “
Gemini API (vision analysis)
```

- **One server** handles both frontend (React) and backend (Express)
- Built React app is served from `/dist` directory
- All `/api/*` routes handled by Express
- Sessions managed with HTTP-only cookies

## Security Checklist

-  `.env` file is gitignored (secrets not in GitHub)
-  `SESSION_SECRET` is a strong random string
-  `ACCESS_KEYWORD` is known only to instructor and students
-  `GEMINI_API_KEY` stored in Render environment variables
-  HTTP-only cookies prevent XSS attacks
-  Express session middleware handles authentication

## Troubleshooting

### Build Fails

**Error:** `Cannot find module 'express-session'`

**Fix:** Ensure `express-session` is in `dependencies` (not `devDependencies`) in `package.json`

### Session Not Persisting

**Error:** "Session not established" on every request

**Fix:** Check that `SESSION_SECRET` is set in environment variables

### API Key Errors

**Error:** "Invalid API key"

**Fix:**
1. Verify `GEMINI_API_KEY` is set correctly in Render dashboard
2. Ensure no extra spaces or newlines in the key
3. Test the key locally first

### Out of Memory

**Error:** Server crashes during analysis

**Fix:**
- Reduce `MAX_CONCURRENT_SESSIONS` to 5-8 on free tier
- Upgrade to Starter plan (1GB RAM)
- Limit video file size in the UI

## Cost Estimate

**Render.com Free Tier:**
- 750 hours/month free
- 512MB RAM
- Sleeps after 15 min inactivity
- Good for testing and light classroom use

**Render.com Starter ($7/month):**
- Always-on (no sleep)
- 1GB RAM
- Better for active classroom with multiple students

**Gemini API (Pay-as-you-go):**
- Gemini 2.5 Flash: ~$0.00002 per image
- Example: 5-frame analysis = ~$0.0001
- 1000 analyses = ~$0.10
- Very affordable for classroom use!

## Updating Your Deployment

When you make code changes:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Render automatically redeploys when you push to GitHub (if auto-deploy is enabled).

## Custom Domain (Optional)

In Render dashboard:
1. Go to your service settings
2. Click **"Custom Domains"**
3. Follow instructions to add your domain

## Support

- **Render Docs:** https://render.com/docs
- **Gemini API Docs:** https://ai.google.dev/docs
- **This Project:** Check README.md and QUICKSTART.md
