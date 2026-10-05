# Property Portal

Property Portal is a web-first property marketplace for Myanmar. Browse homes, apartments, and land for sale or rent in Yangon and Mandalay, then switch between Burmese and English.

The root checkout remains a working combined preview. Independent sibling projects are available in `api/`, `app/`, and `mobile/`, each with its own Git history and project README. The root tracks their published commits as Git submodules.

## GitHub repositories

- [Property-preview](https://github.com/BhoneMyat784/Property-preview) — combined preview, product specification, and workspace documentation.
- [Property-preview-api](https://github.com/BhoneMyat784/Property-preview-api) — independent Express API.
- [Property-preview-app](https://github.com/BhoneMyat784/Property-preview-app) — independent Expo web app.
- [Property-preview-mobile](https://github.com/BhoneMyat784/Property-preview-mobile) — independent Expo native foundation.

Clone the complete workspace:

```bash
git clone --recurse-submodules https://github.com/BhoneMyat784/Property-preview.git
cd Property-preview
```

For an existing clone, initialize the projects at the recorded commits:

```bash
git submodule update --init --recursive
```

Make project changes inside the corresponding repository. Commit and push child changes first, then stage the changed submodule path in the root, commit its updated pointer, and push the root. A root commit records the child commit; it does not include uncommitted child files. Submodule checkouts start at a detached commit, so switch to the intended project branch before making changes.

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
- [API project README](api/README.md) — independent server project.
- [Web app project README](app/README.md) — independent browser project.
- [Mobile project README](mobile/README.md) — independent native Expo project.
- [AGENTS.md](AGENTS.md) — stable technology choices and repository boundaries.
- [SPEC.md](SPEC.md) — current feature specification, gaps, and prioritized roadmap.
- [CLAUDE.md](CLAUDE.md) — contributor entry point that refers to `AGENTS.md`.

## Data and local mail

SQLite data and uploaded photos are kept in the local data directory configured by `.env`. The development mail inbox is available through the local server for verification and password-reset testing. Configure SMTP only when deploying to a real mail service.

## Current project shape

The combined preview keeps the server under `server/`, Expo Router screens under `src/app/`, shared UI under `src/components/`, shared contracts under `src/shared/`, and committed SQLite migrations under `migrations/`. The sibling projects contain the corresponding split copies and must remain independently versioned.
