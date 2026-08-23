import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { buildAuthUrl, nextFromLocation } from './safeNext';
import NeoLoading from '../shared/components/NeoLoading';

/*
  The one canonical guard for every route that requires a signed-in user —
  Dashboard, Profile, Create/Join Trip, etc. all wrap in this instead of
  each inventing its own redirect. `next` defaults to the CURRENT location
  (path + query string), so a route never has to hard-code where it lives;
  pass an explicit `next` only to override that (rare).

  An anonymous visitor lands here in one of two ways:
    - typing/bookmarking/reloading the URL directly -> sent to
      /auth?next=<path>. (An idle/server session expiry while sitting on a
      protected route is instead caught by SessionLifecycle, mounted once
      at the router root — it owns navigating with the idle-expiry reason,
      so this guard doesn't duplicate that redirect.)
    - navigated here by AuthPage's "Continue as guest" action, which passes
      router state { fromGateway: true } -> renders through immediately,
      since the gateway has already been shown and guest continuation was
      the user's explicit choice.
  Authenticated visitors always render through, regardless of state.
*/
const GatedRoute = ({ next, children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <NeoLoading />;
  if (!user && !location.state?.fromGateway) {
    return <Navigate to={buildAuthUrl(next || nextFromLocation(location))} replace />;
  }
  return children;
};

export default GatedRoute;
