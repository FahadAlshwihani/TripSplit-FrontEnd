import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logout as logoutRequest, logoutAllDevices as logoutAllDevicesRequest, updateProfile } from '../features/auth/api/authApi';
import { onSessionExpired } from './sessionEvents';
import { broadcastLoggedOut, onLoggedOutElsewhere } from './crossTab';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Set once, either by the server (a request came back one of the
  // session-expiry 401 codes) or by the client-side idle timer noticing
  // the user's configured inactivity policy first. Either way this is the
  // single source of truth RequireAuth/SessionLifecycle read to redirect
  // with the right expiry message, instead of every call site guessing
  // why `user` went null. `sessionExpiredReason` is one of
  // 'session_idle_timeout' | 'session_revoked' | 'session_expired' |
  // 'idle' (the client-side timer's own local detection, before any
  // server round-trip confirms it) — see SessionLifecycle.
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState(null);

  const refreshUser = async () => {
    try {
      const result = await getCurrentUser();
      setUser(result?.user || null);
      return result?.user || null;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setAuthLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // expireSession() is best-effort on the network leg — the point of
  // forcing a user out (idle or server-detected) is to clear local state
  // immediately regardless of whether the fire-and-forget logout call
  // succeeds, so it never awaits/blocks on it.
  const expireSession = (reason = 'idle') => {
    logoutRequest().catch(() => {});
    setUser(null);
    setSessionExpired(true);
    setSessionExpiredReason(reason);
    broadcastLoggedOut();
  };

  useEffect(() => onSessionExpired(expireSession), []);

  // Another tab logged out (explicitly, or was force-expired) -- this tab
  // never made the network call itself, so just adopt the same local
  // state a real 401 would have produced, without a redundant request.
  useEffect(() => onLoggedOutElsewhere(() => setUser(null)), []);

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    broadcastLoggedOut();
  };

  const logoutAllDevices = async () => {
    await logoutAllDevicesRequest();
    setUser(null);
    broadcastLoggedOut();
  };

  const saveProfile = async (profile) => {
    const updated = await updateProfile(profile);
    setUser(updated);
    return updated;
  };

  const consumeSessionExpired = () => { setSessionExpired(false); setSessionExpiredReason(null); };

  const status = authLoading ? 'loading' : (user ? 'authenticated' : 'anonymous');

  const value = useMemo(() => ({
    user, setUser, authLoading, status, isAuthenticated: Boolean(user),
    logout, logoutAllDevices, saveProfile, refreshUser, expireSession, sessionExpired, sessionExpiredReason, consumeSessionExpired,
  }), [user, authLoading, status, sessionExpired, sessionExpiredReason]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
