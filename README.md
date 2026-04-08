<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repo now includes:
- **Frontend** (Vite + React) on port `3000`
- **Backend** (Express API) on port `8787`

View your app in AI Studio: https://ai.studio/apps/2e0a213e-6b14-427b-be3f-0efec4058677

## Prerequisites

- Node.js 18+

## Environment

Create `.env.local` and add:

```bash
GEMINI_API_KEY=your_key_here
# Optional
# GEMINI_MODEL=gemini-2.0-flash
# PORT=8787
```

## Install

```bash
npm install
```

## Run locally

Terminal 1 (backend):

```bash
npm run dev:server
```

Terminal 2 (frontend):

```bash
npm run dev
```

Frontend API calls to `/api/*` are proxied to the backend server.

## Backend endpoints

- `GET /api/health`
- `POST /api/ai/generate`
  - body: `{ "prompt": "...", "systemInstruction": "optional" }`
  - returns: `{ "text": "..." }`

## Build and checks

```bash
npm run lint
npm run build
```
