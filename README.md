<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Wordpilot (Frontend + Backend Integration)

This repo now includes:
- **React + Vite frontend**
- **Express backend API** for auth, AI generation, and dictation grading

## Prerequisites

- Node.js 20+

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` (frontend) and optionally `.env` (backend) with:
   ```bash
   GEMINI_API_KEY=your_gemini_key
   GEMINI_MODEL=gemini-2.5-flash
   PORT=4000
   ```

## Run locally

Start backend:
```bash
npm run dev:server
```

In a second terminal, start frontend:
```bash
npm run dev
```

Vite proxies `/api/*` calls to `http://localhost:4000`.

## API routes

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/ai/generate`
- `POST /api/dictation/grade`
