import React, { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import GatedRoute from '../../auth/GatedRoute';
import RequireOnboarding from '../../auth/RequireOnboarding';

// Account routes: authenticated-user pages, all behind the one canonical
// GatedRoute guard (next is derived from the current URL automatically —
// see GatedRoute) instead of each page inventing its own redirect.
// /account is the global authenticated home -- there is no intermediate
// generic Dashboard page between authentication and Account.
const Account = lazy(() => import('../../features/account/pages/AccountPage'));
const ProfileSetupRoute = lazy(() => import('../../features/profile/pages/ProfileSetupRoute'));

const accountRoutes = [
  <Route path="/profile/setup" element={<RequireOnboarding><ProfileSetupRoute /></RequireOnboarding>} key="profile-setup" />,
  <Route path="/account" element={<GatedRoute><Account /></GatedRoute>} key="account" />,
  // Legacy URLs kept working for anyone with an old link/bookmark -- the
  // standalone Profile page and the generic Dashboard it used to point to
  // no longer exist as separate pages; the Global Account Hub supersedes
  // both entirely. (Individual trip dashboards at /trips/:tripId/... are a
  // completely different route tree, untouched by this.)
  <Route path="/account/profile" element={<Navigate to="/account" replace />} key="account-profile-redirect" />,
  <Route path="/profile" element={<Navigate to="/account" replace />} key="profile-redirect" />,
  <Route path="/dashboard" element={<Navigate to="/account" replace />} key="dashboard-redirect" />,
];

export default accountRoutes;
