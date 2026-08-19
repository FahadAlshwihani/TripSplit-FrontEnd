# Trip Split Frontend

React 18 single-page application for registered and guest trip participants.

## Local setup

Node 18 or newer is required. This Create React App 5 project has legacy peer metadata, so install the existing lockfile with:

```powershell
npm ci --legacy-peer-deps
Copy-Item .env.example .env
npm start
```

The default API URL is `http://127.0.0.1:8000/api/v1`. Start the Django backend first.

## Commands

```powershell
npm start
$env:CI='true'; npm test -- --runInBand
npm run build
```

## Main flows

- Guests create or join a trip with a display name and predefined avatar. The browser retains the opaque, trip-scoped guest credential; clearing storage makes an anonymous membership unrecoverable.
- Registered users authenticate with an emailed six-digit OTP. The access session is an HttpOnly cookie, never localStorage. New users complete name/avatar onboarding and can reopen server-side trip history.
- Expense creation selects a payer and equal-split participants. A request UUID prevents duplicate financial posts.
- The trip page displays server-calculated member balances and deterministic settlement suggestions.

## Security notes

Axios sends cookies with `withCredentials: true` and attaches Django's CSRF token to modifying requests. Only guest trip credentials are stored in localStorage, under a trip-specific key. No passwords, OTPs, session cookies, or registered-user tokens are stored by JavaScript.

## Structure

```text
src/auth/             current-user session state
src/pages/            home, OTP/onboarding, profile, trip, informational pages
src/components/       existing layout, summary/chart, balances, loading
src/utils/api.js      versioned API client and guest credential transport
src/utils/avatars.js  stable local predefined avatar catalog
```

The visual direction remains the existing Trip Split card-based experience with its responsive layout and English/Arabic foundation. Phase 1 extends it rather than replacing it.
