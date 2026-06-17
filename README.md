<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WordPilot Setup

This project is being upgraded from a UI prototype into a real application with authentication, user profiles, saved texts, AI history, and dictation session persistence.

## Stack

- React + Vite
- Tailwind CSS v4
- Supabase Auth
- Supabase Postgres
- Supabase Storage (planned next)

## Local Setup

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Fill in:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
   `GEMINI_API_KEY`
   `STRIPE_SECRET_KEY`
   `SUPABASE_SERVICE_ROLE_KEY`
4. Run the SQL in [schema.sql](/C:/Users/galal/Desktop/WORDPILOT%20New_version/supabase/schema.sql:1) inside your Supabase SQL editor
5. Start the app:
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

## Before Testing Billing Or Admin

- Apply the latest Supabase migrations, including `supabase/migrations/202605040001_security_hardening.sql`.
- Set `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, and `APP_URL` in `.env.local`.
- Optional: tune `VITE_IDLE_TIMEOUT_MINUTES` and `VITE_IDLE_WARNING_SECONDS` for stricter or more relaxed browser session timeout behavior.
- Restart `npm run dev` after changing environment variables.

## Netlify Production

- Production URL: `https://wordpilot.netlify.app/`
- Netlify build command: `npm run build`
- Netlify publish directory: `dist`
- Client auth redirects use `VITE_APP_URL=https://wordpilot.netlify.app`.
- SPA routing is handled by `netlify.toml` and `public/_redirects`.
- The contact page uses Netlify Forms. Enable form detection in Netlify and configure notification recipients in the Netlify Forms UI.
- API-backed features still require a deployed backend for the routes in `server.ts` (`/api/ai`, `/api/stripe`, `/api/billing`, and `/api/admin`). Set `VITE_API_BASE_URL` to that backend origin in Netlify, and set the backend environment variables: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` or `ADMIN_USER_IDS`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `BILLING_EMAIL_FROM`, `APP_URL=https://wordpilot.netlify.app`, `PUBLIC_APP_URL=https://wordpilot.netlify.app`, and `ALLOWED_ORIGINS=https://wordpilot.netlify.app`.
