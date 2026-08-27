// Minimal pub/sub bridging the axios response interceptor (outside React)
// to AuthContext (inside React) for a server-detected session_expired 401 —
// avoids every feature needing its own 401 handling, per the "one
// authoritative continuation mechanism" requirement.
const listeners = new Set();

export const onSessionExpired = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const emitSessionExpired = (code) => listeners.forEach((callback) => callback(code));
