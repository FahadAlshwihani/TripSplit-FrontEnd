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
