# Video Analyzer AI

A React and Express teaching prototype by Gerd Kortuem for IDEM307 at TU Delft. It samples video frames, sends them to Google Gemini, and produces descriptions or a continuous narrative. This is the older server-backed project; the separate [video-analyzer](https://github.com/kortuem/video-analyzer) is a browser-only early prototype. Neither link establishes which tool is currently supported for teaching.

The October 2026 maintenance update fixes credential handling and setup documentation. Historical workshop documentation is retained as context, not as a current production or capacity guarantee. Live deployment and current classroom use have not been verified.

## Run locally

Use Node.js 20.19+ or 22.12+ (matching Vite's supported ranges).

```sh
git clone https://github.com/kortuem/idem307-video-analyzer.git
cd idem307-video-analyzer
npm ci
cp .env.example .env
```

Edit `.env`: set `GEMINI_API_KEY`, a private `ACCESS_KEYWORD`, and a random `SESSION_SECRET` of at least 32 characters. Generate the latter with `openssl rand -base64 32`. Placeholder values are rejected. Never put a shared key in a `VITE_` variable: those values are public browser code.

```sh
# Terminal 1
npm run dev:server
# Terminal 2
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Enter the instructor keyword or a personal Gemini API key. Choose a short video you have permission to send to Google, select a perspective, and analyze it. Successful results appear beside sampled frames and can be exported. Google's quotas, model access and billing apply. The default model is `gemini-2.5-flash`; check account access before a workshop.

## Data and access

With a personal API key, the browser sends frames and prompts directly to Google using an `x-goog-api-key` header. Key-format detection happens locally and is not proof of validity; Google checks it on use. The key is held in page memory. Reload or clear it when finished.

With an instructor keyword, the browser authenticates with this server and sends frames/prompts through `/api/analyze` or `/api/generate-summary`. The shared key stays on the server; Google still receives the content. HTTP-only session cookies expire after 30 minutes. They reduce cookie theft through JavaScript but do not make the app immune to XSS.

This prototype has **no application rate or concurrent-session limiter**. The old `MAX_CONCURRENT_SESSIONS` example was unused and has been removed. The default Express memory session store is for local development, not durable or multi-instance operation. Before shared public deployment, configure a persistent session store, gateway quotas/access controls, HTTPS, and provider spending limits. Requests have a 60-second upstream timeout. No provider retention or zero-storage guarantee is made.

## Checks and deployment

```sh
npm test
npm run lint
npm run build
```

Tests mock Google and require no real key. They cover rejected placeholder settings, unauthenticated proxy calls, key headers, and sanitized provider/transport errors. Browser checks should also cover personal-key entry, instructor login, and two successive video uploads.

`npm start` serves the built app with production cookies; use HTTPS. Deployment settings and historical capacity claims must be verified before reuse. Contact g.w.kortuem@tudelft.nl with project questions; no support SLA is promised.

## Rights

Original code and technical documentation use the [MIT License](LICENSE). See [RIGHTS.md](RIGHTS.md) for third-party and data exclusions. Historical student-facing usage notes remain in [TUTORIAL.md](TUTORIAL.md).
