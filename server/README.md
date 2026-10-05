# Property Portal API

This directory contains the Node.js/Express server used by the web application. It owns Better Auth, SQLite access, migrations, seed data, local photo storage, moderation, and the `/api/v1` contracts.

## Run the API

From the repository root:

```bash
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:server
```

The API listens on port 3001 by default. `npm run dev` starts it alongside the Expo web server.

## Endpoint groups

- `/api/auth` — Better Auth email/password, verification, reset, and session routes.
- `/api/v1/health` and `/api/v1/me` — health and current-account checks.
- `/api/v1/locations` — public city and township data.
- `/api/v1/listings` and `/api/v1/listings/:id` — published listing search and details.
- `/api/v1/favorites` — authenticated favorite management.
- `/api/v1/seller/*` — authenticated draft, submit, archive, and photo management.
- `/api/v1/admin/*` — staff/admin moderation and location/category management.
- `/api/v1/photos/:id` — stored photo delivery.
- `/api/v1/dev/inbox` — local development email inspection.

The server enforces ownership, session, role, and listing-state checks. Public queries return published inventory only.

## Database and files

SQLite is migrated with `npm run db:migrate` and seeded with `npm run db:seed`. Schema changes require a new committed migration. The configured data directory contains the SQLite database, uploaded photos, and development mail data. Use `npm run backup` before copying a local environment or upgrading its schema.

## Server checks

```bash
npx tsc -p tsconfig.server.json --noEmit
npm run test
npm run format:check
```

See the root [AGENTS.md](../AGENTS.md) for the server/client boundary and [SPEC.md](../SPEC.md) for the mutable feature behavior.
