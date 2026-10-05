# Repository Engineering Boundaries

Read this file before changing the repository. It records the technical choices and boundaries that should remain stable while the product specification evolves.

## Stable technology choices

- Use TypeScript throughout the server, shared contracts, and Expo client.
- Keep the web-first client on React Native, Expo Router, Expo SDK 57, and React Native Web. The route tree must remain suitable for a later native mobile client.
- Keep the server on Node.js and Express.
- Keep Better Auth for email/password authentication, verification, password reset, and sessions.
- Keep SQLite on the server through `better-sqlite3` and Drizzle ORM with versioned migrations.
- Keep local-disk photo storage behind a storage interface so deployment storage can change later without changing listing behavior.
- Keep the Expo web export and experimental server rendering/data-loader path for public listing pages.
- Keep the local development mail inbox and configurable SMTP boundary for verification and reset flows.

The current implementation uses Drizzle ORM and custom React Native components. The product brief mentions Prisma 7 and shadcn/ui as desired technologies; that is an explicit alignment decision for a future change, not a reason to silently migrate the working code.

## Repository and package boundaries

The current checkout is one repository with these logical areas:

- `server/` owns the Express API, authentication integration, database access, migrations, seed data, uploads, and server-side tests.
- `src/app/` owns Expo Router screens and web navigation.
- `src/components/` owns shared React Native UI components.
- `src/shared/` owns contracts, validation, and values shared by client and server.
- `migrations/` contains committed SQLite schema migrations.

The independent `api`, `app`, and `mobile` Git repositories now live as sibling directories under this checkout. Each has its own `AGENTS.md`, `CLAUDE.md`, and user-facing `README.md`. The root checkout remains a working combined preview and documentation reference; changes to a split project should be made and committed in that project's repository.

## Server/client boundary

- The server is the authority for authentication, authorization, ownership checks, listing lifecycle, moderation, locations, favorites, uploads, and database writes.
- The client must use the shared contracts and `/api/v1` endpoints; it must not import server internals or access SQLite directly.
- Authentication is mounted under `/api/auth`.
- Public listing APIs and rendered pages may expose only published listings. Pending, rejected, withdrawn, sold, rented, and archived records stay out of public results according to the feature specification.

## Engineering rules

- Preserve the existing stack, UI behavior, and working features unless a change is explicitly approved.
- Keep listing ownership and admin/staff permissions enforced on the server even when a control is hidden in the UI.
- Add schema changes through a new versioned migration and update seed data when a feature needs new records.
- Keep Burmese and English UI support, keyboard-accessible web controls, responsive layouts, loading/empty/error states, and stable direct listing links.
- Do not add maps, chat, payments, promoted listings, bookings, offline synchronization, or native release work as incidental scope; these remain deferred features in `SPEC.md`.

## Validation commands

The normal local workflow is documented in the root [README.md](README.md). The stable checks are:

```bash
npm run typecheck
npx tsc -p tsconfig.server.json --noEmit
npm run test
npm run test:e2e
npm run build
```

Use the commands relevant to the files changed, and run the full set before a release or a cross-cutting change.

## Documentation ownership

- `AGENTS.md` is the stable engineering boundary and technology record.
- `SPEC.md` is the mutable product feature specification, current gaps, and feature roadmap.
- `README.md` is the user-facing guide for the current checkout.
- `server/README.md` and `src/app/README.md` are user-facing guides for the current logical subprojects.
- `CLAUDE.md` is a short instruction entry point that refers contributors to this file; it must not become a second source of architectural truth.
