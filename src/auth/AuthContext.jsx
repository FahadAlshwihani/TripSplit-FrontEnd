import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logout as logoutRequest, updateProfile } from '../utils/api';

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => { Promise.resolve(getCurrentUser()).then((result) => setUser(result?.user || null)).catch(() => setUser(null)).finally(() => setAuthLoading(false)); }, []);
  const logout = async () => { await logoutRequest(); setUser(null); };
  const saveProfile = async (profile) => { const updated = await updateProfile(profile); setUser(updated); return updated; };
  const value = useMemo(() => ({ user, setUser, authLoading, logout, saveProfile }), [user, authLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
