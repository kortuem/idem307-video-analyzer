# Quick Start Guide

## Test Locally (5 minutes)

### 1. Check your `.env` file exists
```bash
cat .env
```

Should show:
```
GEMINI_API_KEY=AIzaSy...
ACCESS_KEYWORD=idem307_2025
SESSION_SECRET=change-this-to-random-string-in-production
MAX_CONCURRENT_SESSIONS=12
```

If not, copy from `.env.example` and edit.

### 2. Start backend
```bash
npm run dev:server
```

Should see:
```
Video Analyzer server running on port 3000
Access keyword configured: Yes
```

### 3. Start frontend (new terminal)
```bash
npm run dev
```

Should see:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 4. Open browser
```
http://localhost:5173
```

### 5. Test keyword auth
1. Enter: `idem307_2025`
2. Click "Validate"
3. Should see: ✓ Access granted via instructor key
4. Upload a video (e.g., MP4 file)
5. Select perspective (e.g., "Objective Description")
6. Select mode (Isolated or Continuous)
7. Click "Analyze Video"
8. Watch it analyze!

### 6. Test API key auth
1. Click "Clear"
2. Enter your own Gemini API key (starts with AIzaSy...)
3. Click "Validate"
4. Should see: ✓ Using your own API key
5. Upload and analyze

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -ti:3000

# Kill it if needed
lsof -ti:3000 | xargs kill -9

# Try again
npm run dev:server
```

### "Missing Gemini API key" error
Check your `.env` file:
```bash
cat .env | grep GEMINI_API_KEY
```

Make sure it's set and valid.

### Frontend can't connect to backend
Make sure:
1. Backend is running on port 3000
2. Frontend is running on port 5173
3. No firewall blocking localhost

### Validation fails
- Keyword: Must match exactly what's in `.env`
- API key: Must start with `AIzaSy` and be 39 characters

## Next Steps

Once working locally:
- [ ] Test both Isolated and Continuous modes
- [ ] Try different perspectives
- [ ] Test re-analysis feature
- [ ] Download analysis report
- [ ] Deploy to Render (see README.md)

## Useful Commands

```bash
# Check server health
curl http://localhost:3000/api/health

# Build for production
npm run build

# Run production build
NODE_ENV=production npm start

# Check logs
# (Backend logs show in terminal running dev:server)
```

## Production Deployment

See [README.md](./README.md#-deployment-to-rendercom) for full deployment instructions.

Quick version:
1. `npm run build`
2. Push to GitHub
3. Deploy on Render
4. Set environment variables
5. Done!
