# Property Portal Feature Specification

**Status:** Mutable product specification

This document describes product behavior, feature gaps, and the feature roadmap. Stable technology choices, repository boundaries, and engineering rules live in [AGENTS.md](AGENTS.md). User-facing setup lives in [README.md](README.md).

## Product goal

Property Portal is a Burmese and English marketplace for discovering and publishing property listings in Myanmar. Visitors can browse properties for sale or rent. Registered owners and agents can submit listings for review. Approved listings are public, while staff and administrators manage content quality and locations.

The web experience is the first release. The route and contract design must remain usable by a later native mobile client.

## Current feature scope

### Browse and search

- Browse published properties for sale or rent.
- Search by title, description, city, township, and address.
- Filter by transaction type, city, township, category, currency, price range, area, and bedrooms where applicable.
- Require a currency when filtering or sorting by price; MMK and USD are stored and displayed independently without conversion.
- Use URL-persisted filters, pagination, direct listing links, desktop grids, and compact mobile layouts.
- Show loading, empty, retry, and validation states.

### Locations and categories

- Launch with Yangon and Mandalay.
- Support township records beneath each city.
- Launch with land, apartment, and house categories.
- Keep location and category data extensible so more cities, townships, and property types can be added without changing the listing workflow.
- Allow administrators to deactivate locations that are no longer available while retaining existing listing history.

### Listing details

Each published listing can show:

- title, description, transaction type, category, city, township, address, and contact details;
- price, currency, area, and the appropriate unit;
- bedrooms and bathrooms for houses and apartments;
- square feet or acres for land;
- an ordered photo gallery;
- phone contact and optional Viber action, with the number available to copy.

### Accounts and roles

Visitors can browse without an account. Registered users can save favorites and submit listings.

The product distinguishes a user persona from administrative permissions:

- **Owner:** publishes property they own.
- **Agent:** publishes property on behalf of a client.
- **Buyer/renter:** saves and follows listings and contacts the advertiser.
- **Staff:** reviews operational work within an assigned moderation scope.
- **Admin:** manages all moderation, users, locations, and configuration.

An account may have an owner or agent label without receiving admin or staff permissions.

### Seller workflow

Owners and agents can:

1. create a draft;
2. add and reorder photos;
3. edit listing fields;
4. submit the draft for review;
5. see approval or rejection reasons;
6. resubmit a rejected listing;
7. mark a published property sold or rented;
8. withdraw a listing.

Editing a published listing returns it to pending and removes it from public results until it is approved again.

### Moderation workflow

Listing states are `draft`, `pending`, `published`, `rejected`, and `archived`. Moderators can review submissions, approve them, reject them with a reason, remove listings, and retain a moderation history. Pending, rejected, withdrawn, sold, rented, and archived listings are absent from public APIs and rendered public pages.

### Language and accessibility

- Default the interface to Burmese and provide a persistent Burmese/English switcher.
- Keep submitted descriptions in the language supplied by the owner or agent.
- Use a font that supports Myanmar text.
- Keep web controls keyboard accessible with visible focus states and usable labels.
- Preserve responsive layouts and readable loading, empty, error, and upload-failure feedback.

## Feature data

The feature model includes users, profiles, role/persona assignments, cities, townships, categories, listings, ordered photos, favorites, and moderation history. A listing stores its transaction type, location, category, pricing currency, pricing amount, area, optional bedroom/bathroom counts, description, contact information, lifecycle state, and timestamps.

The seed experience should include clearly marked demo listings across Yangon and Mandalay, all launch categories, both currencies, and both sale and rent flows. Demo content must exercise pagination, filters, galleries, and moderation states without appearing as real inventory.

## Current gaps and incomplete features

The current implementation provides the web marketplace foundation, authentication, listing lifecycle, moderation endpoints, favorites, locations, photo handling, bilingual UI, and seeded demo inventory. The following requirements remain incomplete or need product decisions:

- Buying, selling, and renting currently describe marketplace listing and contact flows. Offers, rental applications, contract steps, and transaction completion are not part of the current product behavior.
- Owner and agent publishing is supported in the listing flow, but buyer/renter persona capabilities and staff-scoped permissions need a complete role matrix and UI.
- The launch categories work, while a registry for additional categories and category-specific fields needs to be formalized.
- Yangon and Mandalay are seeded; the location management workflow needs broader township coverage and richer expansion data.
- Demo data is useful for the current preview but needs a larger, more varied fixture set for realistic search, pagination, and moderation testing.
- Native mobile screens, native upload behavior, and mobile-specific navigation remain future work.
- Maps, chat, payments, promoted listings, bookings, and offline synchronization remain deferred.

## Prioritized feature roadmap

### P0: clarify and protect the launch behavior

- Define the role matrix for owner, agent, buyer/renter, staff, and admin, including which role combinations are allowed.
- Confirm that the first release is a listing marketplace with phone/Viber contact, and explicitly defer offers, rental applications, contracts, and payments.
- Define the category field registry and validation rules for land, apartments, houses, and future categories.
- Define the location import and deactivation workflow for new cities and townships.
- Expand the marked demo fixture set so every filter, state, currency, and category has representative data.

### P1: complete marketplace foundations

- Add complete buyer/renter account views for favorites, contacted listings, and saved search preferences.
- Add staff-scoped moderation queues, audit visibility, and clear admin/staff permission tests.
- Add richer listing validation, photo failure recovery, and user-facing submission history.
- Add a controlled inquiry/contact record if phone/Viber contact alone does not meet launch needs.
- Add category and location management screens backed by the existing server authority.

### P2: broaden the product experience

- Add native mobile parity using the shared contracts and route behavior.
- Add a map view after location and privacy requirements are approved.
- Add optional buyer offers and rental applications only after their legal and operational workflow is defined.
- Add analytics for search, listing views, favorites, and contact actions.

### P3: deferred marketplace services

- Chat, payments, promoted listings, bookings, offline synchronization, and production native releases require separate product, security, and operations decisions.

## Feature acceptance criteria

The feature specification is considered met for the web MVP when:

- public browsing supports sale and rent across Yangon and Mandalay, with category, township, currency, price, area, and bedroom filters;
- land, apartment, and house details render with the correct field rules and ordered photos;
- owners and agents can create, submit, revise, and withdraw listings;
- staff and administrators can approve or reject submissions with reasons, and unauthorized users cannot edit another user's listing or access moderation;
- pending and archived inventory is absent from public APIs and rendered pages;
- favorites, authentication, verification/reset flows, photos, listings, and moderation history survive a server restart;
- Burmese/English switching, Myanmar text rendering, keyboard navigation, direct links, pagination, loading, empty, retry, and upload-failure states work in desktop and mobile browser layouts;
- the larger marked demo dataset covers both cities, all launch categories, both currencies, and sale/rent states.

## Open feature decisions

- Should buyer/renter accounts have saved searches and contact history in the first release?
- Should a listing support multiple agents, or exactly one advertiser?
- Which additional categories should follow land, apartment, and house?
- What township data source and review process should govern future location expansion?
- Is a lightweight inquiry record needed before offers or rental applications are considered?
