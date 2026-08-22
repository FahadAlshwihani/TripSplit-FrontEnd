// Reuses the exact open-redirect guard already established in the legacy
// AuthPage/InvitationPage pairing: a `next` destination is only trusted if
// it is a single-leading-slash internal path — never `//host/...`
// (protocol-relative), `/\...` (browsers can treat this like `//`), or
// anything containing a scheme. Anything else falls back to `/`.
const SAFE_NEXT_PATTERN = /^\/(?!\/|\\)\S*$/;

export const getSafeNext = (search, fallback = '/') => {
  const next = new URLSearchParams(search).get('next');
  if (!next) return fallback;
  const trimmed = next.trim();
  return SAFE_NEXT_PATTERN.test(trimmed) ? trimmed : fallback;
};

export const buildAuthUrl = (next) => (
  next && next !== '/' ? `/auth?next=${encodeURIComponent(next)}` : '/auth'
);
