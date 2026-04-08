<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Wordpilot - Prisma + React + Express

This project now uses a **Prisma SQLite database** connected to an **Express backend** and consumed by the React frontend.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Create DB and run migration:
   ```bash
   npm run prisma:migrate
   ```
5. Seed DB with dashboard demo data:
   ```bash
   npm run prisma:seed
   ```
6. Run API server:
   ```bash
   npm run api:dev
   ```
7. In another terminal run frontend:
   ```bash
   npm run dev
   ```

## Endpoints

- `GET /api/health`
- `GET /api/dashboard/:email`
- `POST /api/auth/signup`
- `POST /api/auth/login`
