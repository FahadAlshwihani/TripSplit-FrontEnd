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
- Guest tokens (`localStorage`, per-trip) are mirrored across both identifier forms the moment a trip loads, regardless of which form authenticated the request. This alone isn't sufficient for a guest's *first-ever* visit through a URL-identifier form they've never used before (there's nothing to mirror yet) — `getTrip()` also sends the durable, cross-trip `X-Guest-Device-Token` (see `src/api/credentials.js`) on every bootstrap request; if the backend recognizes the device and reissues a fresh per-trip token (`response.guest_token`), `getTrip()` saves it under both forms immediately. Together these guarantee an existing guest member is never forced through a join flow just because a link used a different identifier form than the one their token happened to be saved under — see `docs/api/trips.md`'s "Identifier model" (backend repo) for the full mechanism.

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

## Loading model: bootstrap vs section loading

Two distinct loading tiers exist, and they are never interchangeable:

- **`NeoLoading`** (full-page/full-width) is reserved for genuinely
  page-blocking states: app/auth bootstrap (`GatedRoute`,
  `RequireOnboarding`), the root `<Suspense>` fallback for lazy route
  chunks (`app/routes/index.jsx`), and `TripLayout`'s own first-ever
  trip resolution (there is no shell to show yet — the trip itself,
  including its title/nav, hasn't loaded). None of the pages routed
  under `TripLayout` (Overview, Expenses, Balances, Fund, Members,
  Governance, Categories, Settlements, Activity, Settings, Support) may
  import it — `src/shared/components/legacyLoaderRemoval.test.js`
  enforces this by walking the actual page files, plus a second guard
  in the same file against any page-level `if (x.loading) return <...>`
  early return that would gate the whole page behind one combined
  fetch.
- **`SectionLoading`** (`src/shared/components/SectionLoading.jsx`) is
  for everything else. Every dashboard page renders its static shell —
  title, subtitle, capability-gated buttons, section headers, card
  containers — unconditionally and immediately, sourcing it from
  already-available data (outlet-context `trip`/`permissions`/
  `currentMember`) wherever possible rather than its own fetch. Only
  the specific region that actually depends on a still-in-flight
  request shows `<SectionLoading minHeight={…} />` (the `minHeight`
  reserves layout space so the section doesn't collapse/jump). Once a
  resource has ever resolved once, its stale data stays visible through
  any later background refetch (`useRouteResource`'s default
  `resetOnKeyChange: false` behavior) instead of being replaced by a
  loading placeholder — a mutation's own refresh, a promote/ban/confirm
  action, must never blank an already-rendered list or card.
- **Independent per-section resources.** Settlements (Current Balances
  / Suggested Settlements / Settlement Ledger) and Governance (Join
  Requests / Invitations / Restricted / Access Settings) each fetch
  their own `useRouteResource` and render their own
  loading/error/content independently, so a slow or failed section
  never blocks or takes down the others on the same page. Where two
  cards read off one combined endpoint response (Current Balances and
  Suggested Settlements both come from one `GET /balances/`), they
  still each own their own `SectionLoading`/`ErrorState` presentation
  rather than sharing one page-level gate — this is a presentational
  split, not an extra round trip. Access Settings and Trip Settings
  need only outlet-context `trip`/`permissions` and never gate on any
  fetch at all.

## Deep links and sharing

`src/shared/utils/shareLinks.js` (`tripUrl(shortCode, path, params)`) is the one place a full, shareable trip URL is built — `short_code` only, from `window.location.origin` (never a hardcoded host), with only non-secret object-focus params (an already-public `FundingRound`/`Settlement` UUID, never a guest/auth/invite token). `src/shared/components/CopyLinkButton.jsx` is the reusable copy/share action built on top of it (`navigator.share` where available, clipboard copy as the universal fallback, transient "Link copied" feedback).

Two pages currently expose deep-link focus targets, both following the same shape: the page shell/data renders exactly as it always does (no fetch is ever gated on the query param), and once the already-loaded, trip-scoped data contains a match, a `useEffect` focuses it — scrolls it into view and/or opens its detail drawer — exactly once per mount. An unmatched id (wrong id, or one belonging to another trip) is silently ignored; there is no separate "fetch by id" endpoint for an invalid id to probe, since the match is always against data the page already fetched for the current trip.

- **Fund**: `?round=<FundingRound id>` scrolls to and force-expands that round (`FundPage.jsx`'s `focusRoundId`). A "Copy Fund Link" action lives in the page header; each round card gets its own compact copy action for the round-scoped link.
- **Settlements**: `?settlement=<Settlement id>` opens `SettlementTimelineDrawer` for that row (`SettlementsPage.jsx`'s `focusSettlementId`). The drawer itself — shared with `BalancesPage`, which also passes `shortCode` — carries the copy-link action, so the same settlement gets the same shareable link regardless of which page opened its drawer.

A deep link only ever focuses/opens existing UI; it never triggers a mutation (confirming a settlement, recording a contribution, etc.) by itself.

## Settings ownership

`TripSettingsPage` never fetches its own data — `trip` is already loaded once by `TripLayout` and shared via outlet context, so the page has no loading state of its own at all (only individual mutations carry local busy state). It reuses the exact same `PATCH /trips/{id}/` mutation Governance/Fund already share — no separate settings endpoint.

- **No `budget` field, anywhere.** The Trip Fund is the one canonical budget (`TripFund.target_amount`, edited only from the Fund page — see `docs/architecture/fund-accounting.md`). Settings never re-exposes it.
- **`join_policy` is the single source of truth Governance and Settings both read/write** — a change in either place shows up in the other on its next fetch. No duplicate boolean. See "Trip Access domain" below for the shared derivation/mutation layer.
- **Currency locks read-only once `trip.currency_locked` is true** (server-derived — see `docs/api/trips.md`'s "Update trip"). Never attempt a client-side conversion of historical amounts.
- **The join/room password is a real feature** (hashed, rate-limited, gates *joining* the trip — not, as a since-corrected mock implied, viewing balances). Leaving the field blank always means "no change"; removing password protection is its own explicitly-confirmed action, never a side effect of a blank Save.
- **Simplify Debts** is shown locked/checked (informational) — there is no backend toggle, `simplify_debts()` runs unconditionally. **Require Receipts for Settlements** is Coming Soon — no receipt/attachment model exists yet; the control is disabled and excluded from every save payload.
- Archive/Restore reuse the existing owner-only endpoints and the same `permissionsFor()` capability flags every other page already reads from outlet context — no new backend capability set was added.

## Trip Access domain

**Settings and Governance are separate UI surfaces over the same Trip Access domain. They must never maintain independent persisted state.** Both are children of the same `TripLayout` route and share its one `trip`/`setTrip` (outlet context) — since React Router keeps `TripLayout` mounted while navigating between sibling routes, a `setTrip(updated)` after either page's mutation is immediately visible to the other on its next render, with no extra cache/sync layer.

Shared frontend helpers (never re-derived or re-assembled inline anywhere else):

- **`src/shared/utils/tripAccess.js`** — `deriveTripAccessState(trip)` maps the canonical backend `join_policy` (`open` / `approval_required` / `invite_only`) to the `{ inviteLinkEnabled, approvalRequired }` shape Governance's two switches render from; `nextJoinPolicy({ inviteLinkEnabled, approvalRequired })` is its exact inverse, used to compute the PATCH payload when either switch fires. Governance holds no independent boolean state — both switches are a pure projection of `join_policy`. Settings' own `join_policy` radio group reads/writes the enum directly and PATCHes through the identical `PATCH /trips/{id}/` call Governance uses.
- **`src/shared/utils/shareLinks.js`** — `tripJoinPath(joinCode)` / `tripJoinUrl(joinCode)` are the one canonical "join this trip" link builder, built from `join_code` (never `short_code` — `/trips/{shortCode}` requires existing membership and 403s a genuine non-member). `tripJoinPath` is the relative form for `navigate()` (Governance/Settings' own rejoin-adjacent flows, `AccountTripRow`'s Rejoin, `GuestTripsList`'s rejoin action); `tripJoinUrl` is the origin-qualified form for anything that leaves the app (copy/share). A static test (`tripAccessDuplicationGuard.test.js`) walks the source tree asserting no file other than `shareLinks.js` itself contains a hand-built `/trips/join?code=` string.
- **`buildTripShareMessage`** (from the localized-share-message work) is the one message builder both Governance's and Settings' invite-copy actions call, driven by the same live `trip` — never a page-local reassembly of the invite text.

"Copy Link" (URL only, via `tripJoinUrl`) and "Copy/Share Invite Message" (the full localized message from `buildTripShareMessage`, which embeds that same URL) are deliberately distinct, separately-labeled actions — never two controls with the same label copying different things.

Rotate Join Code (`POST /trips/{id}/rotate-join-code/`) is Governance-only; Settings has no equivalent control (adding one would be a Settings redesign, out of scope here). Trip password state (`Trip.password_hash`) is owned and shown only by Settings' access-security card; Governance never reads or displays it. Both surfaces enforce mutation access via server-side `require_admin` regardless of which client-side capability check gated the button — Governance reads server-derived `trip.governance_capabilities`, Settings reads the general `permissions.canEditTrip` (same owner/admin who could already edit title/dates/currency); both currently resolve identically and neither is client-side-only authorization.

## Primary redesign surfaces

Public/Home, Auth, Profile, Trip shell/navigation, Overview, Expenses, Balances, Fund, Members, Governance, Categories/Budgets, Settlements, Activity, and Settings are the visual entry points. Fund workflows and governance workflows are already decomposed into focused components; redesign those components in place instead of recombining them into large panels.
