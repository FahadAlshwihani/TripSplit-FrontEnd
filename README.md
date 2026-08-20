# Trip Split Frontend

React 18 single-page application for registered and guest trip participants.

## Local setup

Node 18 or newer is required. This Create React App 5 project has legacy peer metadata, so install the existing lockfile with:

```powershell
npm ci --legacy-peer-deps
Copy-Item .env.example .env
npm start
```

The lockfile intentionally pins `react-router-dom` and `react-router` to 6.30.6. The application uses the stable v6 routing API and does not require React Router 7. If an interrupted install leaves `node_modules` inconsistent, remove only `node_modules`, run `npm cache verify`, and repeat the `npm ci` command above; do not regenerate the lockfile.

The default API URL is `http://localhost:8000/api/v1`. Start the Django backend first. Keep the browser and API on the same hostname in development (`localhost` by default) so the SPA can read Django's host-scoped CSRF cookie for authenticated writes.

## Commands

```powershell
npm start
$env:CI='true'; npm test -- --runInBand
npm run build
```

## Main flows

- Guests create or join a trip with a display name and predefined avatar. The browser retains the opaque, trip-scoped guest credential; clearing storage makes an anonymous membership unrecoverable.
- Registered users authenticate with an emailed six-digit OTP. The access session is an HttpOnly cookie, never localStorage. New users complete name/avatar onboarding and can reopen server-side trip history.
- Expense creation and editing share one form supporting multiple payers plus equal, exact, percentage, and weighted splits. Client totals are form assistance only; Django remains authoritative.
- The trip page displays settlement-adjusted server balances, suggestions, and recorded settlement history.
- Owners manage roles, transfer ownership, update settings, and archive or restore trips. Members can leave without erasing their financial history.
- Activity, member management, settlements, and archived read-only state are localized in Arabic and English and retain the responsive card layout.

## Security notes

Axios sends cookies with `withCredentials: true` and attaches Django's CSRF token to modifying requests. Only guest trip credentials are stored in localStorage, under a trip-specific key. No passwords, OTPs, session cookies, or registered-user tokens are stored by JavaScript.

## Structure

```text
src/auth/             current-user session state
src/pages/            home, OTP/onboarding, profile, trip, informational pages
src/components/       layout, expense form, balances, settlements, members, activity, settings
src/utils/api.js      versioned API client and guest credential transport
src/utils/avatars.js  stable local predefined avatar catalog
```

The visual direction remains the existing Trip Split card-based experience with its responsive layout and English/Arabic foundation. Phase 1 extends it rather than replacing it.

## Phase 3 UI

Trip managers can review requests, issue one-time email/guest invitations, kick members, manage room bans, and select the join policy in the existing responsive management surface. `/invite/:token` validates and accepts invitation capabilities without treating the token as durable identity.

The expense form now supports shared/personal scope, server-defined categories, and duplicate-to-draft. The overview consumes server aggregates. Recipients can confirm/reject pending settlements, owners can close/reopen settled trips, and expenses, settlements, and activity keep independent Load More pagination state.

## Phase 3.1 completion

Approval-required joins now persist a waiting screen, poll every 12 seconds, and support requester cancellation. Email invitation routes survive OTP and first-time onboarding through the short-lived `next` URL; invitation tokens are never copied into localStorage. The same page automatically resumes acceptance after authentication.

Trip managers can create, rename, archive, and budget categories. Budget cards show authoritative spent, remaining, percentage, allocated, and unallocated values. Quick Expense is a compact request builder for shared equal splits or personal expenses and expands into the existing full form through **More options**.

Member rows open a privacy-safe detail view with aggregate financial statistics and last activity. Pending settlement confirmations use the lightweight trip-detail count, and registered trip history is grouped into Active, Closed, and Archived sections.

### Dependency security decision

Phase 3.1 pins patched compatible releases of Axios, React Router 6, the i18next HTTP backend, SweetAlert2, and AJV. Remaining audit findings originate in the Create React App 5 build/development dependency graph. They are not application runtime libraries emitted as independently reachable server components; resolving them cleanly requires a separately planned CRA-to-modern-tooling migration. `npm audit fix --force` is intentionally not used.

## Phase 4 Fund and foreign-currency workflow

The trip page includes a mobile-friendly Fund section. Owners/admins can create the Fund, select its holder, create equal or custom collection rounds, record partial contributions, start deficit top-ups, preview proportional/equal refunds, distribute a surplus, and close a resolved Fund. Members see authoritative collected, spent, available/deficit, and per-round contribution cards; the browser never derives the Fund balance.

The full expense form defaults to the trip currency. Selecting a foreign currency reveals an editable manual rate expressed as `1 original currency = X trip currency` and a converted preview. Saved cards show the original value and locked base-currency approximation. Fund payment is available only for shared expenses and deliberately has no personal payer allocation. Quick Expense remains base-currency-first; foreign currency stays under the full options flow.

Small-screen trip navigation is horizontally scrollable and sticky rather than compressing every panel label. Fund statistics, rounds, contributions, and refund controls stack into cards below 768px; primary controls maintain touch-sized targets, numeric inputs request mobile decimal keyboards, dialogs remain viewport-bounded, long names wrap, and reduced-motion preferences disable decorative transitions. The layout uses logical properties so the same rules remain usable in Arabic RTL.
