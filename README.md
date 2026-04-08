# Wordpilot / Scholar Script

Full-stack dictation training app with a React + TypeScript frontend, Express API backend, and Prisma schema for MySQL.

## Tech stack
- Frontend: Vite + React + TypeScript
- Backend: Express (Node)
- ORM: Prisma
- Database: MySQL

## Environment setup
Copy `.env.example` to `.env` and configure values:

```bash
cp .env.example .env
```

Required variables:
- `VITE_API_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `DATABASE_URL` (MySQL)
- `JWT_SECRET`

## Run app

```bash
npm install
npm run dev
```

This starts:
- frontend at `http://localhost:3000`
- backend at `http://localhost:4000`

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

Schema: `prisma/schema.prisma`
Initial SQL migration: `prisma/migrations/20260407220000_init/migration.sql`

## Implemented flows
- Signup/login and session token handling
- Dashboard with fetched sessions + saved texts
- AI Lab text generation and saving to library
- Dictation workspace save/grade session flow
- Settings persistence hooks (speech rate and word gap)

> Note: The backend currently uses in-memory storage for runtime behavior in this environment. Prisma schema + migration are included and ready for MySQL-backed integration.
