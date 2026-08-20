const guestKey = (tripId) => `tripsplit:guest:${tripId}`;
export const saveGuestToken = (tripId, token) => localStorage.setItem(guestKey(tripId), token);
export const getGuestToken = (tripId) => localStorage.getItem(guestKey(tripId));
export const tripRequest = (tripId, config = {}) => {
  const token = getGuestToken(tripId);
  return { ...config, headers: { ...config.headers, ...(token ? { 'X-Guest-Token': token } : {}) } };
};
export const joinRequestCredential = (token, config = {}) => ({ ...config, headers: { ...config.headers, ...(token ? { 'X-Join-Request-Token': token } : {}) } });
