import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const QuickActionRefreshContext = createContext(null);

export function QuickActionRefreshProvider({ children }) {
  const [versions, setVersions] = useState({});
  const invalidate = useCallback((domains) => {
    setVersions((current) => {
      const next = { ...current };
      domains.forEach((domain) => { next[domain] = (next[domain] || 0) + 1; });
      return next;
    });
  }, []);
  const value = useMemo(() => ({ versions, invalidate }), [versions, invalidate]);
  return <QuickActionRefreshContext.Provider value={value}>{children}</QuickActionRefreshContext.Provider>;
}

export const useQuickActionInvalidation = () => useContext(QuickActionRefreshContext)?.invalidate || (() => {});

// Routes opt in explicitly. Updating a version refreshes only the active
// feature resource whose key includes it; DashboardShell never remounts and
// unrelated routes never fetch in response to a quick action.
export const useQuickActionRevision = (domain) => useContext(QuickActionRefreshContext)?.versions?.[domain] || 0;
