# Property Portal

Property Portal is a web-first property marketplace for Myanmar. Browse homes, apartments, and land for sale or rent in Yangon and Mandalay, then switch between Burmese and English.

The current checkout contains the Express API and Expo web application together. The planned `api`, `app`, and `mobile` sibling Git repositories are not split out yet.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:8081](http://localhost:8081). The API runs on port 3001 and the web app runs on port 8081. To run one side only, use `npm run dev:server` or `npm run dev:web`.

The seed command creates marked demo listings across both cities, launch categories, sale/rent, and MMK/USD. It also creates the local development accounts described in the seed output. Never use seeded credentials in production.

## What you can try

- Search and filter published sale and rental listings.
- Open a direct listing page, browse its gallery, and copy the phone contact.
- Register, sign in, save favorites, and switch the interface language.
- Create a seller draft, upload/reorder photos, submit it, and follow its moderation state.
- Review submissions with an administrator account.

## Common commands

```bash
npm run typecheck
npx tsc -p tsconfig.server.json --noEmit
npm run test
npm run test:e2e
npm run build
npm run preview
npm run backup
```

`npm run build` exports the web application and compiles the server. `npm run preview` serves the production-style web export on port 3000.

## Project guides

- [Server/API README](server/README.md) — API, database, seed data, uploads, and server workflows.
- [Expo web app README](src/app/README.md) — routes, browser behavior, language support, and web development.
- [AGENTS.md](AGENTS.md) — stable technology choices and repository boundaries.
- [SPEC.md](SPEC.md) — current feature specification, gaps, and prioritized roadmap.
- [CLAUDE.md](CLAUDE.md) — contributor entry point that refers to `AGENTS.md`.

## Data and local mail

SQLite data and uploaded photos are kept in the local data directory configured by `.env`. The development mail inbox is available through the local server for verification and password-reset testing. Configure SMTP only when deploying to a real mail service.

## Current project shape

The server lives under `server/`, Expo Router screens under `src/app/`, shared UI under `src/components/`, shared contracts under `src/shared/`, and committed SQLite migrations under `migrations/`. Keep those boundaries until the planned sibling repository split is approved.
