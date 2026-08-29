# WordPilot

WordPilot is a language-learning web app with signup/login, onboarding, practice paths, AI Lab generation, dictation, shadowing, billing, user accounts, and admin operations.

## Stack

- React + Vite
- Tailwind CSS v4
- Node.js + Express production API
- Supabase Auth and Postgres
- Stripe Checkout and webhooks
- Gemini-backed AI generation and pronunciation review

## Local Setup

**Prerequisite:** Node.js 20 or newer.

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Fill public browser variables:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`.
4. Fill server-only variables:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
5. Apply the SQL files in `supabase/migrations` in Supabase before testing admin, billing, AI usage, or saved learning data.
6. Start the full local app:
   `npm run dev`

The local command starts one Express server. In development it mounts Vite middleware for the frontend and serves all `/api/*` endpoints from `server.ts`, so local testing matches production routing.

## Production Runtime

The canonical production backend is `server.ts`. The app is intended to run as a Node/Express service on Hostinger VPS or any equivalent Node host.

Build and run:

```bash
npm ci
npm run build
NODE_ENV=production PORT=3000 npm run preview
```

Recommended Hostinger/VPS shape:

- Run the Node app with a process manager such as PM2 or systemd.
- Put Nginx, Apache, or Hostinger's reverse proxy in front of the Node port.
- Route `https://wordpilot.itscope24.de/*` to the Node server.
- Keep `VITE_API_BASE_URL` empty when frontend and API share the same origin.
- Set `APP_URL`, `PUBLIC_APP_URL`, and `ALLOWED_ORIGINS` to the production domain.
- Configure Supabase Auth redirect URLs for both local development and production.
- Point Stripe webhooks to `https://wordpilot.itscope24.de/api/stripe/webhook`.

Netlify is no longer the production backend for this repository. There are no Netlify function routes in the app; `/api/*` must be served by the Node/Express server.

## Environment Rules

Public `VITE_*` variables are bundled into the browser and must only contain browser-safe values.

Server-only variables must never be prefixed with `VITE_` and must be stored in the Hostinger/VPS secret environment:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- transcript proxy credentials such as `WEBSHARE_PROXY_USERNAME` and `WEBSHARE_PROXY_PASSWORD`

If any secret was pasted into chat, logs, screenshots, or committed history, rotate it before production.

## Checks

Run these before pushing or deploying:

```bash
npm run lint
npm test
npm run build
```

`npm test` currently covers the API route manifest and dictation analysis smoke checks. The API smoke check ensures frontend-facing routes stay backed by the Express production server.

## Production Security Checklist

- Keep Supabase RLS enabled on public tables and apply every migration.
- Use `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- Keep admin authorization based on trusted server checks, not browser metadata.
- Keep `ALLOWED_ORIGINS` restricted to trusted local and production origins.
- Verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`.
- Protect the GitHub `main` branch with required CI checks.
- Keep repository secrets out of `.env.local`, logs, screenshots, and commits.
