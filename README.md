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
   `VITE_GEMINI_API_KEY`
4. Run the SQL in [schema.sql](/C:/Users/galal/Desktop/WORDPILOT%20New_version/supabase/schema.sql:1) inside your Supabase SQL editor
5. Start the app:
   `npm run dev`

## Implemented Foundation

- Supabase client wiring
- Auth provider and protected routes
- Real login/signup flows
- Account settings page
- Session saving from the dictation workspace
- Generated text saving from AI Lab

## Next Phase

- Replace dashboard mock data with live Supabase queries
- Add password reset flow
- Add billing and subscription tables
- Move AI generation behind a secure server function
