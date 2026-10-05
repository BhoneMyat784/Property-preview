# Property Portal Web App

This directory contains the Expo Router route tree for the browser experience. It uses React Native components rendered through React Native Web, with shared contracts from `src/shared/` and server data from `/api/v1`.

## Run the web app

From the repository root:

```bash
npm ci
npm run dev:web
```

Open [http://localhost:8081](http://localhost:8081). Run the API in a second terminal with `npm run dev:server`, or use `npm run dev` to start both processes together.

## Main routes

- `/` — home search and featured inventory.
- `/properties` — filterable, paginated public results.
- `/properties/:id` — listing details, gallery, contact actions, and favorite control.
- `/auth` — registration, sign in, verification, and password reset.
- `/favorites` — the signed-in user's saved listings.
- `/dashboard` — seller listings and submission status.
- `/dashboard/listings/new` — create a draft listing.
- `/dashboard/listings/:id` — edit fields, upload/reorder photos, submit, or archive.
- `/admin` and `/admin/locations` — moderation and location administration.

The interface defaults to Burmese and includes a persistent Burmese/English switcher. Public filters are kept in the URL so a result set can be shared directly. All public pages are expected to render published listing content correctly in the production web export.

## Browser validation

```bash
npm run typecheck
npm run test:e2e
npm run build
npm run preview
```

The web route tree is intentionally shared with the future native app direction. Do not import server internals into screens; use shared contracts and the API boundary. See the root [AGENTS.md](../../AGENTS.md) for stable project rules.
