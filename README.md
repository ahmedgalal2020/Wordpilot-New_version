<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WordPilot Setup

This project is being upgraded from a UI prototype into a real application with authentication, user profiles, saved texts, AI history, dictation session persistence, billing, and admin operations.

## Stack

- React + Vite
- Tailwind CSS v4
- Supabase Auth
- Supabase Postgres
- Netlify Functions
- Supabase Storage (planned next)

## Local Setup

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Fill in the public Supabase values:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
4. Fill in server-only values for API-backed features:
   `GEMINI_API_KEY`
   `STRIPE_SECRET_KEY`
   `SUPABASE_SERVICE_ROLE_KEY`
5. Run the SQL migrations in `supabase/migrations` inside your Supabase SQL editor if they have not already been applied.
6. Start the app:
   `npm run dev`

## Implemented Foundation

- Supabase client wiring
- Auth provider and protected routes
- Real login/signup flows
- Password reset and recovery flow
- Account settings page
- Session saving from the dictation workspace
- Generated text saving from AI Lab
- Live dashboard data from Supabase
- Billing and subscription tables
- Server-side billing sync and admin access checks
- Security hardening migration for billing RLS
- Idle session timeout with a keep-session prompt
- Netlify Function API for production `/api/*` routes

## Before Testing Billing Or Admin

- Apply the latest Supabase migrations.
- Set `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, and `APP_URL` in `.env.local`.
- Optional: tune `VITE_IDLE_TIMEOUT_MINUTES` and `VITE_IDLE_WARNING_SECONDS` for stricter or more relaxed browser session timeout behavior.
- Restart `npm run dev` after changing environment variables.

## Netlify Production

- Production URL: `https://wordpilot.itscope24.de/`
- Netlify fallback URL: `https://wordpilot.netlify.app/`
- Netlify build command: `npm run build`
- Netlify publish directory: `dist`
- Production API routes are deployed from `netlify/functions/api.mts` and served from the same origin under `/api/*`.
- Keep `VITE_API_BASE_URL` empty when the frontend and Netlify Function API are on the same site.
- Client auth redirects use `VITE_APP_URL=https://wordpilot.itscope24.de`.
- SPA routing and API rewrites are handled by `netlify.toml`.
- Store `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, `STRIPE_WEBHOOK_SECRET`, and `RESEND_API_KEY` as secret Netlify environment variables.
- Public browser variables may keep the `VITE_` prefix only when they are intentionally safe to expose, such as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_STRIPE_PUBLISHABLE_KEY`.
- Do not use `VITE_GEMINI_API_KEY`; AI generation must go through the server-side `GEMINI_API_KEY` used by the Netlify Function.
- Set `APP_URL=https://wordpilot.itscope24.de`, `PUBLIC_APP_URL=https://wordpilot.itscope24.de`, and `ALLOWED_ORIGINS=https://wordpilot.itscope24.de` in Netlify.

## Production Security Checklist

- Rotate any token or service key that has been shared outside the secrets manager.
- Revoke public execute permissions from Supabase helper functions that should not be callable by app users.
- Complete Stripe webhook signature verification and subscription fulfillment before relying on paid subscriptions in production.
- Protect the GitHub `main` branch with pull requests and required checks.
- Keep the repository private if business logic or unreleased product details should not be public.
