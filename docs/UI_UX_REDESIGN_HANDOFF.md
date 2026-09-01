# UI/UX redesign handoff

Trip Split is functionally complete through Phase 4.2. The next pass may change presentation, but it must preserve the behavioral architecture summarized here.

## Route map

- Public: `/`, `/about`, `/auth`, `/invite/:token`, `/join-request/:requestId`
- Account: `/profile`
- Trip shell: `/trips/:tripId`
  - Overview: `/trips/:tripId/overview`
  - Expenses: `/trips/:tripId/expenses`
  - Balances: `/trips/:tripId/balances`
  - Fund: `/trips/:tripId/fund`
  - Members: `/trips/:tripId/members`
  - Governance and invitations: `/trips/:tripId/governance`
  - Categories and budgets: `/trips/:tripId/categories`
  - Settlements: `/trips/:tripId/settlements`
  - Activity: `/trips/:tripId/activity`
  - Settings and lifecycle: `/trips/:tripId/settings`

`TripLayout` owns only the common trip request, access/error handling, trip identity, current-member context, lifecycle/permission context, and nested navigation. Feature pages rendered through its React Router `Outlet` own their reads and mutations.

**`:tripId` accepts either identifier form.** The trip's `short_code` (a short, opaque, share-friendly locator) or its `id` (UUID, every legacy/bookmarked link) both resolve the same trip — the backend's `resolve_trip()` disambiguates (see `docs/api/trips.md`'s "Identifier model" in the backend repo). `TripLayout` fetches once by whatever's in the URL, then:
- If the URL segment wasn't already the canonical `short_code`, it replaces the address bar with the canonical form (`navigate(..., { replace: true })`, never a new history entry), preserving the rest of the path/query/hash.
- **DashboardShell's own navigation** (sidebar/topbar/mobile-nav — everything that *builds* in-app links) receives `short_code`, so clicking around the app stays on canonical short URLs.
- **Every trip-scoped page's own API calls** (via `useOutletContext().tripId`) keep receiving the UUID `id`, completely unchanged from before short_code existed — this is deliberate: it means no feature page had to change at all, only `TripLayout` and `DashboardShell`'s own nav-link construction.
- Guest tokens (`localStorage`, per-trip) are mirrored across both identifier forms the moment a trip loads, regardless of which form authenticated the request — an existing guest member is never forced through a join flow just because a link used a different identifier form than the one their token happened to be saved under.

## Behavioral boundaries

The redesign must not change these without an explicit product requirement:

- API contracts, feature API ownership, or scoped guest/join-request headers
- route paths, nested-route semantics, deep-link behavior, or `TripLayout` ownership
- passwordless authentication, session/CSRF behavior, guest persistence, or invitation continuation
- expense, split, settlement, Trip Fund, contribution, refund, or multi-currency accounting
- role permissions, join policies, bans, invitations, lifecycle rules, or notification behavior
- abort-aware GET cancellation, mutation idempotency, pagination protection, polling cleanup, or error isolation
- Arabic/English translation behavior and RTL direction

The backend remains authoritative for permissions and all financial calculations.

## Allowed redesign scope

The redesign may change layout, navigation presentation, typography, spacing, cards, forms, dialogs, icons, animation, responsive composition, visual hierarchy, and the styling of loading, empty, error, and retry states. Existing actions, validations, confirmations, accessibility semantics, and mobile reachability must remain intact.

## Ownership rules

Shared HTTP infrastructure lives in `src/api`; domain endpoints live in `src/features/*/api`. Domain components and pages stay in their owning feature. Only reusable, domain-neutral primitives and hooks belong under `src/shared`. Do not reintroduce a generic domain API monolith or a page that eagerly orchestrates every trip feature.

## Data and failure behavior

- Route pages load only their required resources.
- Safe route-scoped GET requests receive an abort signal and are cancelled on dependency change or unmount.
- POST/PATCH/DELETE operations are not automatically retried or treated as disposable reads.
- The trip shell remains visible when a secondary feature request fails.
- Every route retains meaningful loading, empty, error, and explicit retry states.

## Primary redesign surfaces

Public/Home, Auth, Profile, Trip shell/navigation, Overview, Expenses, Balances, Fund, Members, Governance, Categories/Budgets, Settlements, Activity, and Settings are the visual entry points. Fund workflows and governance workflows are already decomposed into focused components; redesign those components in place instead of recombining them into large panels.
