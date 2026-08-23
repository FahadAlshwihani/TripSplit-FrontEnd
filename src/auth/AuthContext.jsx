import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logout as logoutRequest, updateProfile } from '../features/auth/api/authApi';
import { onSessionExpired } from './sessionEvents';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Set once, either by the server (a request came back 401
  // session_expired) or by the client-side idle timer noticing 5 minutes
  // of inactivity first. Either way this is the single source of truth
  // RequireAuth/SessionLifecycle read to redirect with the idle-expiry
  // message, instead of every call site guessing why `user` went null.
  const [sessionExpired, setSessionExpired] = useState(false);

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
  const expireSession = () => {
    logoutRequest().catch(() => {});
    setUser(null);
    setSessionExpired(true);
  };

  useEffect(() => onSessionExpired(expireSession), []);

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const saveProfile = async (profile) => {
    const updated = await updateProfile(profile);
    setUser(updated);
    return updated;
  };

  const consumeSessionExpired = () => setSessionExpired(false);

  const status = authLoading ? 'loading' : (user ? 'authenticated' : 'anonymous');

  const value = useMemo(() => ({
    user, setUser, authLoading, status, isAuthenticated: Boolean(user),
    logout, saveProfile, refreshUser, expireSession, sessionExpired, consumeSessionExpired,
  }), [user, authLoading, status, sessionExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
