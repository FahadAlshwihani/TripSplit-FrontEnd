# Trip Split Frontend

React 18 single-page application for registered and guest trip participants.

## Local setup

Node 18 or newer is required. This Create React App 5 project has legacy peer metadata, so install the existing lockfile with:

```powershell
npm ci --legacy-peer-deps
Copy-Item .env.example .env
npm start
```

The lockfile intentionally pins `react-router-dom` and `react-router` to 6.28.2. The application uses the stable v6 routing API and does not require React Router 7. If an interrupted install leaves `node_modules` inconsistent, remove only `node_modules`, run `npm cache verify`, and repeat the `npm ci` command above; do not regenerate the lockfile.

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
