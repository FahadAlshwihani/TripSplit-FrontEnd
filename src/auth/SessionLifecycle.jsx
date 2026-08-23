import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { buildAuthUrl, nextFromLocation } from './safeNext';
import { getCurrentUser } from '../features/auth/api/authApi';

// Mirrors the backend's AUTH_IDLE_TIMEOUT_SECONDS default (config/settings/
// base.py) — this client-side timer is only a UX nicety (redirect promptly
// without waiting for a request to fail); the server enforces the real
// limit regardless of what this does.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 15 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

/*
  Mounted once at the router root (sibling to <Routes>, so it has both
  useNavigate/useLocation and — since AuthProvider is an ancestor of
  AppRouter — useAuth). Owns the two halves of session lifecycle the rest
  of the app shouldn't each reimplement:

  1. Idle detection: tracks real interaction (pointer/keyboard/touch/wheel)
     plus regaining tab focus/visibility as "activity" (going hidden does
     NOT count — an unattended background tab must not stay alive just by
     sitting open). 5 minutes with none of that calls expireSession().
  2. Heartbeat: only while authenticated, the tab is visible, AND recent
     activity exists — never from a background tab — pings GET /auth/me/
     (already the boot-restoration endpoint; no separate endpoint needed)
     at most once a minute, which doubles as extending the server-side
     session per the backend's IdleSessionMiddleware.

  Whichever fires first — this timer, or the axios interceptor catching a
  server-side 401 session_expired — lands on the same `sessionExpired`
  flag in AuthContext, which this component turns into the one redirect:
  back to Auth with the current route preserved as `next` and an 'idle'
  reason for AuthPage to render the localized expiry message.
*/
const SessionLifecycle = () => {
  const { isAuthenticated, expireSession, sessionExpired, consumeSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(0);

  useEffect(() => {
    const markActive = () => { lastActivityRef.current = Date.now(); };
    const handleVisibility = () => { if (document.visibilityState === 'visible') markActive(); };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', markActive);
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', markActive);
    };
  }, []);

  // Navigating is itself meaningful activity.
  useEffect(() => { lastActivityRef.current = Date.now(); }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const tick = () => {
      const idleForMs = Date.now() - lastActivityRef.current;
      if (idleForMs >= IDLE_TIMEOUT_MS) {
        expireSession();
        return;
      }
      const visible = document.visibilityState === 'visible';
      const dueForHeartbeat = Date.now() - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS;
      if (visible && dueForHeartbeat) {
        lastHeartbeatRef.current = Date.now();
        // A session_expired 401 here is handled globally by the response
        // interceptor (emits the same event expireSession() sets below);
        // any other failure is not actionable from a background heartbeat.
        getCurrentUser().catch(() => {});
      }
    };
    const interval = setInterval(tick, IDLE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, expireSession]);

  useEffect(() => {
    if (!sessionExpired) return;
    navigate(buildAuthUrl(nextFromLocation(location)), { replace: true, state: { reason: 'idle' } });
    consumeSessionExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionExpired]);

  return null;
};

export default SessionLifecycle;
