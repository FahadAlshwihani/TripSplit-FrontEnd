// The one canonical local-storage namespace for a device-remembered guest
// identity (display name + avatar). This is UX persistence only -- it is
// never treated as authorization. Actual trip access always goes through
// the server-issued, trip-scoped guest credential in api/credentials.js;
// this store only makes returning-guest flows (Join Trip, Create Trip,
// the "Change" identity editor) skip re-typing a name/avatar they already
// picked on this device.
const STORAGE_KEY = 'tripsplit:guest-profile';

const AVATAR_FIELDS = ['avatar_key', 'avatar_type', 'avatar_color', 'avatar_style', 'avatar_seed', 'avatar_animation'];

const randomId = () => (
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`
);

export const loadGuestProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.display_name ? parsed : null;
  } catch {
    return null;
  }
};

// `profile` is the same {display_name, ...avatarFields} shape already
// destructured out of guestProfile/ProfileSetupPage submissions elsewhere
// in the app -- callers pass it straight through, no reshaping needed.
export const saveGuestProfile = (profile) => {
  const existing = loadGuestProfile();
  const now = new Date().toISOString();
  const next = {
    version: 1,
    local_profile_id: existing?.local_profile_id || randomId(),
    display_name: profile.display_name,
    ...Object.fromEntries(AVATAR_FIELDS.filter((field) => profile[field] !== undefined).map((field) => [field, profile[field]])),
    created_at: existing?.created_at || now,
    updated_at: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearGuestProfile = () => localStorage.removeItem(STORAGE_KEY);
