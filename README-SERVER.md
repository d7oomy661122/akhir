# Server Setup Guide

Step 1 — Install yt-dlp:
  Linux/Mac: pip install yt-dlp  OR  brew install yt-dlp
  Windows: download yt-dlp.exe and add to PATH

Step 2 — Install dependencies:
  cd server && npm install

Step 3 — Run the server:
  node index.js
  (runs on port 3001 by default)

Step 4 — Update frontend API base URL:
  In SmartPlayer.tsx, the API_BASE constant should point to:
  - Development: http://localhost:3001
  - Production: your deployed server URL

Step 5 — Deploy options:
  - Railway.app (free tier, supports Node.js + yt-dlp via pip)
  - Render.com (free tier)
  - Any VPS with Node.js installed
