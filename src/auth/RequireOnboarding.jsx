import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { buildAuthUrl, getSafeNext, nextFromLocation } from './safeNext';
import NeoLoading from '../shared/components/NeoLoading';

/*
  Guards the standalone /profile/setup route: only an authenticated user
  with an incomplete profile ever sees it. A complete profile visiting
  directly (e.g. an old bookmark) is bounced to wherever `next` points
  (or /account, the global authenticated home) rather than re-shown
  onboarding.
*/
const RequireOnboarding = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <NeoLoading />;
  if (!user) return <Navigate to={buildAuthUrl(nextFromLocation(location))} replace />;
  if (user.onboarding_complete) return <Navigate to={getSafeNext(location.search, '/account')} replace />;
  return children;
};

export default RequireOnboarding;
