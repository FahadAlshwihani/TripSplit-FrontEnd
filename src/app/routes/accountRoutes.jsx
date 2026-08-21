import React, { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';

// Account routes: authenticated-user pages. ProfilePage itself already
// guards on `user`/`authLoading` from AuthContext (redirects to /auth when
// signed out), so no separate AuthenticatedRoute wrapper is added here —
// that would just duplicate the same check.
const Profile = lazy(() => import('../../pages/ProfilePage'));

const accountRoutes = [
  <Route path="/account/profile" element={<Profile />} key="account-profile" />,
  // Legacy URL kept working for anyone with an old link/bookmark.
  <Route path="/profile" element={<Navigate to="/account/profile" replace />} key="profile-redirect" />,
];

export default accountRoutes;
