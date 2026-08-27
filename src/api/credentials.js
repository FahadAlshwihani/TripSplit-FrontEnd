const guestKey = (tripId) => `tripsplit:guest:${tripId}`;
export const saveGuestToken = (tripId, token) => localStorage.setItem(guestKey(tripId), token);
export const getGuestToken = (tripId) => localStorage.getItem(guestKey(tripId));
export const clearGuestToken = (tripId) => localStorage.removeItem(guestKey(tripId));
export const tripRequest = (tripId, config = {}) => {
  const token = getGuestToken(tripId);
  return { ...config, headers: { ...config.headers, ...(token ? { 'X-Guest-Token': token } : {}) } };
};
export const joinRequestCredential = (token, config = {}) => ({ ...config, headers: { ...config.headers, ...(token ? { 'X-Join-Request-Token': token } : {}) } });

// The durable, cross-trip guest DEVICE credential (see docs/architecture/
// guest-identity.md) -- distinct from the per-trip tokens above. Kept in
// the same header+localStorage pattern as the existing per-trip guest
// tokens for consistency with the already-shipped, already-reviewed guest-
// auth mechanism, rather than introducing a second, incompatible
// (cookie-based) credential mechanism for what is conceptually the same
// kind of bearer secret.
const GUEST_DEVICE_KEY = 'tripsplit:guest-device-token';
export const getGuestDeviceToken = () => localStorage.getItem(GUEST_DEVICE_KEY);
export const saveGuestDeviceToken = (token) => { if (token) localStorage.setItem(GUEST_DEVICE_KEY, token); };
export const clearGuestDeviceToken = () => localStorage.removeItem(GUEST_DEVICE_KEY);
export const guestDeviceRequest = (config = {}) => {
  const token = getGuestDeviceToken();
  return { ...config, headers: { ...config.headers, ...(token ? { 'X-Guest-Device-Token': token } : {}) } };
};
