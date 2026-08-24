// A local index of which trips this device has a guest membership in, so
// they stay discoverable across sessions (and claimable after sign-in).
// This index is purely a UX convenience list -- it never stores the actual
// guest credential (that stays in api/credentials.js's own per-trip key)
// and is never treated as authorization; the server always re-verifies the
// real guest token for any trip access or claim.
const STORAGE_KEY = 'tripsplit:guest-trips';

const readIndex = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeIndex = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

export const listGuestTrips = () => readIndex();

export const recordGuestTrip = ({ tripId, title = null, relationship = 'member' }) => {
  if (!tripId) return;
  const list = readIndex().filter((entry) => entry.trip_id !== tripId);
  list.unshift({ trip_id: tripId, title, relationship, last_accessed_at: new Date().toISOString() });
  writeIndex(list);
};

export const removeGuestTrip = (tripId) => writeIndex(readIndex().filter((entry) => entry.trip_id !== tripId));

export const clearGuestTrips = () => localStorage.removeItem(STORAGE_KEY);
