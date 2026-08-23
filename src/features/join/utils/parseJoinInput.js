// The "Trip Code or Link" field accepts three shapes: a bare join code,
// a full TripSplit URL carrying ?code= or ?token=, or a raw invitation
// token pasted directly. This is the one place that disambiguates them —
// the backend never receives ambiguous input, and never sees any part of
// a URL it doesn't need (no path/host parsing happens server-side).
const CODE_RE = /^[A-Za-z0-9]{4,12}$/;

const extractFromUrl = (raw) => {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const params = url.searchParams;
  if (params.get('token')) return { mode: 'token', value: params.get('token') };
  if (params.get('code')) return { mode: 'code', value: params.get('code').toUpperCase() };
  const inviteMatch = url.pathname.match(/\/invite\/([^/]+)/);
  if (inviteMatch) return { mode: 'token', value: inviteMatch[1] };
  return null;
};

// Returns { mode: 'code' | 'token', value } or null if the input can't be
// classified as either (e.g. empty, or too short/garbled to be either).
export const parseJoinInput = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return extractFromUrl(trimmed);
  }
  if (CODE_RE.test(trimmed)) return { mode: 'code', value: trimmed.toUpperCase() };
  if (trimmed.length > 12) return { mode: 'token', value: trimmed };
  return null;
};

export default parseJoinInput;
