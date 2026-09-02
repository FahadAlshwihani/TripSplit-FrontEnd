// Every user-facing/copied/shared trip URL must be built from this one
// helper -- short_code only, never the internal UUID (see
// docs/architecture/identifiers.md). Built from the browser's own
// origin (never a hardcoded host), so it naturally resolves to
// localhost in dev and the real domain in production. Query params are
// non-secret object focus hints only (a round/settlement id, both
// already-public UUIDs) -- never a guest/auth/invite token.
export const tripUrl = (shortCode, path = '', params = {}) => {
  const url = new URL(`/trips/${shortCode}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

// The one canonical "join this trip" path/URL pair -- deliberately NOT
// tripUrl() (which lands directly on /trips/{shortCode}, a route that
// requires existing membership -- a genuine non-member hitting it gets
// a plain 403, not a join flow). /trips/join?code={join_code} is the
// real, already-working join entry point (JoinTripPage). join_code is
// its own canonical identifier (rotatable, see rotateJoinCode) --
// distinct from short_code, never interchangeable with it (see
// docs/architecture/trip-access.md).
//
// `tripJoinPath` is the relative form, for React Router's own
// navigate() (an in-app redirect straight into the join flow --
// AccountTripRow's Rejoin, GuestTripsList's own rejoin action).
// `tripJoinUrl` is the full origin-qualified form, for anything that
// leaves the app (copy/share) -- Governance and Settings' own invite
// actions. Every "/trips/join?code=" string in the app is built from
// one of these two, never assembled inline a second time.
export const tripJoinPath = (joinCode) => `/trips/join?code=${encodeURIComponent(joinCode)}`;
export const tripJoinUrl = (joinCode) => new URL(tripJoinPath(joinCode), window.location.origin).toString();
