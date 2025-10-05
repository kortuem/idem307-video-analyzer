# Git Repository Setup Guide

**Status:** This is NOT currently a git repository. We'll create a fresh one.

## Step 1: Initialize Local Git Repository

From the project root:

```bash
git init
git add .
git commit -m "Initial commit - Video Analyzer v3.0"
```

## Step 2: Create New GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `video-analyzer` (or your preferred name)
3. **Description:** "AI-powered video frame analysis with dual authentication and continuous narrative mode"
4. **Visibility:**
   - **Public** - if you want to share with students/world
   - **Private** - if you want to keep it internal
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

## Step 3: Connect Local to GitHub

GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/video-analyzer.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 4: Verify

After pushing:

```bash
git status
# Should show: "Your branch is up to date with 'origin/main'"
```

Visit your GitHub repository URL to see the code online.

## What Gets Committed vs Ignored

###  Committed (public):
- All source code (`src/`, `server.js`, etc.)
- `package.json` with dependencies
- `.env.example` (safe template)
- `.gitignore` (protects secrets)
- `README.md`, `QUICKSTART.md`, `DEPLOYMENT.md`
- `render.yaml` (deployment config)

### L Ignored (stays local):
- `.env` - Contains your actual API keys!  
- `internal/` - Development notes and analysis
- `node_modules/` - Dependencies (reinstalled via npm)
- `dist/` - Build output (regenerated)

## Double-Check Before Pushing

Run this to verify `.env` is NOT staged:

```bash
git status
```

Should NOT see `.env` in the list. If you do:

```bash
git reset .env
echo ".env" >> .gitignore
```

## After GitHub Setup

Once your code is on GitHub, you can deploy to Render:

1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Click **"New +"** ’ **"Web Service"**
3. Connect to your GitHub repository
4. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for environment variables

## Troubleshooting

### "Permission denied (publickey)"

You need to set up GitHub authentication:

**Option A: HTTPS (easier):**
- Use `https://github.com/...` URL
- GitHub will prompt for username/password or token

**Option B: SSH:**
- Follow [GitHub's SSH key guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### "Repository already exists"

- Choose a different repository name
- Or use an existing empty repository

### ".env accidentally committed"

If you accidentally committed `.env`:

```bash
git rm --cached .env
git commit -m "Remove .env from git"
git push
```

Then go to GitHub ’ Repository Settings ’ Secrets and rotate your API key!
