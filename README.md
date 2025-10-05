# Video Analyzer AI v3.0

AI-powered video frame analysis with **dual authentication** and **continuous narrative mode**.

## 🔒 Dual Authentication

Students can use **either**:
1. **Access keyword** from instructor → Uses shared API key (rate limited)
2. **Own Gemini API key** → Direct access (no rate limit)

**Auto-detected** - just enter one or the other!

## ✨ Features

### Analysis Modes
- **Isolated Mode:** Each frame analyzed independently
- **Continuous Mode:** Context-aware narrative with frame-to-frame continuity

### Analysis Perspectives
- Objective Description
- Urban Planning Analysis
- Social Dynamics Analysis
- Safety Assessment
- Accessibility Review
- Creative Fiction (First-Person Story)

### Smart Features
- Dark theme UI (React + Tailwind)
- Re-analysis with different perspectives (reuses captured frames)
- Downloadable analysis reports
- Adaptive frame sampling in continuous mode
- Highlight detection for significant events
- Summary generation

## 🚀 Quick Start

### For Students

**👉 See [TUTORIAL.md](./TUTORIAL.md) for complete step-by-step guide**

1. Visit the deployed app URL
2. Enter your **access keyword** OR your **own Gemini API key**
3. Upload a video
4. Select perspective and mode
5. Analyze!

### For Instructors (Local Development)

1. **Clone and setup:**
   ```bash
   git clone <repo-url>
   cd video-analyzer
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   ACCESS_KEYWORD=your_chosen_keyword
   SESSION_SECRET=change-this-to-random-string-in-production
   MAX_CONCURRENT_SESSIONS=12
   ```

3. **Run locally:**
   ```bash
   # Terminal 1: Backend
   npm run dev:server

   # Terminal 2: Frontend
   npm run dev
   ```

4. **Open:** `http://localhost:5173`

## 📦 Deployment

This app can be deployed to platforms like Render.com, Heroku, or any Node.js hosting service.

**Requirements:**
- Node.js runtime
- Environment variables: `GEMINI_API_KEY`, `ACCESS_KEYWORD`, `SESSION_SECRET`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

**For detailed deployment instructions, contact the repository maintainer.**

## 🔑 How Authentication Works

```
┌────────────────────────────────┐
│   Student enters input         │
└───────────┬────────────────────┘
            │
    ┌───────▼────────┐
    │ Auto-detect    │
    └───┬────────┬───┘
        │        │
  [Keyword]  [API Key]
     │           │
     ▼           ▼
Backend Proxy  Direct to
(rate limited) Gemini API
     │           │
     └─────┬─────┘
           │
        Analysis
```

**Keyword Detection:**
- Starts with `AIzaSy` + 39 chars = API Key
- Anything else = Access Keyword

## 📊 Analysis Modes Explained

### Isolated Mode
Each frame is analyzed independently:
```
Frame 1: "A busy street with pedestrians..."
Frame 2: "An urban intersection with traffic..."
Frame 3: "People crossing at a crosswalk..."
```

### Continuous Mode
Context flows between frames:
```
"The scene opens on a busy urban street where pedestrians
begin crossing. As time progresses, we observe the group
moving across the intersection while new individuals enter
from the left. The traffic light shifts, and vehicles..."
```

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.5 Flash
- **State:** React Context + useReducer
- **Deployment:** Render.com

## 📁 Project Structure

```
video-analyzer/
├── src/
│   ├── components/        # React components
│   │   ├── ApiKeyBanner.jsx
│   │   ├── AnalysisControls.jsx
│   │   ├── AnalysisResults.jsx
│   │   └── VideoNarrative.jsx
│   ├── services/          # Business logic
│   │   ├── geminiClient.js      (dual-auth routing)
│   │   ├── analysisManager.js   (analysis orchestration)
│   │   └── frameCaptureService.js
│   ├── state/             # State management
│   ├── utils/             # Utilities & perspectives
│   └── App.jsx
├── server.js              # Backend proxy
├── package.json
└── .env
```

## 🔐 Security

- **HTTP-only cookies:** Session management immune to XSS attacks
- **Keyword auth:** API key stays on server (students can't extract it)
- **Session secret:** Cryptographically signs cookies
- **Rate limiting:** Max concurrent sessions prevents abuse
- **Own API key:** Client-side only (no server storage)

## 📈 Capacity Planning

**Memory per session:** ~30-50MB (depends on video length)

**Recommended limits:**
- 512MB RAM → `MAX_CONCURRENT_SESSIONS=8`
- 1GB RAM → `MAX_CONCURRENT_SESSIONS=12-15`
- 2GB RAM → `MAX_CONCURRENT_SESSIONS=25-30`

## 🐛 Troubleshooting

### "Server busy" error
- Too many concurrent users
- Wait 2-3 minutes and retry
- Or use your own API key (bypasses limit)

### Session not established
- Clear browser cookies and try again
- Check that `SESSION_SECRET` is set in environment variables
- Verify backend is running

### Analysis fails
- Check your API key/keyword is valid
- Verify video format (MP4, WebM, MOV)
- Check browser console for errors
- Ensure backend and frontend are both running (in dev mode)

## 📚 API Endpoints

### `POST /api/auth/validate`
Validate access keyword or detect API key. Sets HTTP-only cookie for session.

**Request:**
```json
{
  "keyword": "your_access_keyword"  // or "AIzaSy..."
}
```

**Response (Keyword):**
```json
{
  "success": true,
  "auth_type": "keyword"
}
```

**Response (API Key):**
```json
{
  "success": true,
  "auth_type": "api_key"
}
```

### `POST /api/analyze`
Analyze video frame (keyword auth only). Requires session cookie.

**Request:**
```json
{
  "image_data": "base64...",
  "perspective_prompt": "Describe this frame..."
}
```

### `POST /api/generate-summary`
Generate narrative summary (keyword auth only). Requires session cookie.

**Request:**
```json
{
  "prompt": "Summarize this narrative..."
}
```

### `GET /api/health`
Check server health and capacity.

## 🎓 For Course Use

**Sharing with students:**

1. Deploy to Render
2. Share the URL + access keyword
3. Students can analyze videos without needing their own API key
4. Advanced students can use their own keys for unlimited access

**Cost estimation (with keyword auth):**
- 20 students × 5 videos each = 100 videos
- ~$20-30/month with Gemini 2.5 Flash

## 🔮 Future Enhancements

- [ ] Redis for session persistence across server restarts
- [ ] Admin dashboard for monitoring usage
- [ ] Per-student usage quotas
- [ ] Batch video processing
- [ ] Export to JSON/CSV/PDF formats

## 📄 License

MIT License

## 🙏 Credits

- Built with Claude Code (AI pair programming)
- Google Gemini 2.5 Flash API
- Original prototype: TU Delft IDEM307

---

**Version:** 3.0.0
**Status:** Production Ready
**Date:** October 2025
