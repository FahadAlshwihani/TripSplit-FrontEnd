import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { buildAuthUrl, nextFromLocation } from './safeNext';
import { recordActivity } from '../features/auth/api/authApi';

const IDLE_CHECK_INTERVAL_MS = 15 * 1000;
// Never call the activity endpoint more than once a minute, and only in
// response to genuine interaction -- see recordActivity()'s own docs and
// docs/architecture/authentication.md's "background requests must not
// count as activity" section.
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
     sitting open) and route navigation. Only runs at all when the signed-
     in user has a configured idle_logout_minutes — the DEFAULT is `null`
     ("Never"), in which case this component does no idle work and no
     heartbeat at all, matching "no needless polling."
  2. Heartbeat: only while authenticated, an idle policy is configured, the
     tab is visible, AND recent activity exists, calls POST /auth/activity/
     (never a generic data-fetch endpoint) at most once a minute — the
     ONLY thing that refreshes the server's idle clock, so a background
     poll elsewhere in the app can never itself keep an idle session alive.

  Whichever fires first — this timer, or the axios interceptor catching a
  server-side session-expiry 401 — lands on the same `sessionExpired` flag
  in AuthContext, which this component turns into the one redirect: back
  to Auth with the current route preserved as `next` and the specific
  reason for AuthPage to render matching copy.
*/
const SessionLifecycle = () => {
  const { user, isAuthenticated, expireSession, sessionExpired, sessionExpiredReason, consumeSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(0);
  const idleMinutes = user?.idle_logout_minutes ?? null;

  useEffect(() => {
    if (idleMinutes == null) return undefined;
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
  }, [idleMinutes]);

  // Navigating is itself meaningful activity.
  useEffect(() => {
    if (idleMinutes == null) return;
    lastActivityRef.current = Date.now();
  }, [location.pathname, idleMinutes]);

  useEffect(() => {
    if (!isAuthenticated || idleMinutes == null) return undefined;
    const idleTimeoutMs = idleMinutes * 60 * 1000;
    const tick = () => {
      const idleForMs = Date.now() - lastActivityRef.current;
      if (idleForMs >= idleTimeoutMs) {
        expireSession('idle');
        return;
      }
      const visible = document.visibilityState === 'visible';
      const dueForHeartbeat = Date.now() - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS;
      if (visible && dueForHeartbeat) {
        lastHeartbeatRef.current = Date.now();
        // A session-expiry 401 here is handled globally by the response
        // interceptor (emits the same event expireSession() sets below);
        // any other failure is not actionable from a background heartbeat.
        recordActivity().catch(() => {});
      }
    };
    const interval = setInterval(tick, IDLE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, idleMinutes, expireSession]);

  useEffect(() => {
    if (!sessionExpired) return;
    navigate(buildAuthUrl(nextFromLocation(location)), { replace: true, state: { reason: sessionExpiredReason || 'idle' } });
    consumeSessionExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionExpired]);

  return null;
};

export default SessionLifecycle;
