import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { buildAuthUrl } from './safeNext';
import NeoLoading from '../shared/components/NeoLoading';

/*
  Gates a route behind the Auth Gateway for anonymous visitors, while
  leaving CreateTripPage/JoinTripPage themselves completely untouched (they
  keep working exactly as already tested when rendered directly). An
  anonymous visitor lands here in one of two ways:
    - typing/bookmarking/reloading the URL directly -> redirected to
      /auth?next=<path>, same as any other unauthenticated arrival.
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
    return <Navigate to={buildAuthUrl(next)} replace />;
  }
  return children;
};

export default GatedRoute;
