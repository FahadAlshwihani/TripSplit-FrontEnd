// Cross-tab logout sync (Part X of the persistent-auth architecture): if
// the user logs out (explicitly, or via a forced idle/revoked expiry) in
// one tab, every other open tab must recognize it too, without either tab
// storing any session credential in localStorage. BroadcastChannel is the
// right primitive for this — same-origin only, no persistence, nothing
// sensitive in the payload (just a bare "logged out" signal, never a
// reason/token/user id).
const CHANNEL_NAME = 'tripsplit-auth';
let channel = null;

const getChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return channel;
};

export const broadcastLoggedOut = () => {
  try {
    getChannel()?.postMessage({ type: 'logged-out' });
  } catch {
    // BroadcastChannel unsupported/unavailable -- this tab just won't
    // notify others; each tab still self-corrects on its own next
    // request via the normal 401 handling.
  }
};

export const onLoggedOutElsewhere = (callback) => {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (event) => {
    if (event?.data?.type === 'logged-out') callback();
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
};
