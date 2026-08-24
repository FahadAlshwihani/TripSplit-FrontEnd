import React, { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import GatedRoute from '../../auth/GatedRoute';
import RequireOnboarding from '../../auth/RequireOnboarding';

// Account routes: authenticated-user pages, all behind the one canonical
// GatedRoute guard (next is derived from the current URL automatically —
// see GatedRoute) instead of each page inventing its own redirect.
const Account = lazy(() => import('../../features/account/pages/AccountPage'));
const Dashboard = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const ProfileSetupRoute = lazy(() => import('../../features/profile/pages/ProfileSetupRoute'));

const accountRoutes = [
  <Route path="/dashboard" element={<GatedRoute><Dashboard /></GatedRoute>} key="dashboard" />,
  <Route path="/profile/setup" element={<RequireOnboarding><ProfileSetupRoute /></RequireOnboarding>} key="profile-setup" />,
  <Route path="/account" element={<GatedRoute><Account /></GatedRoute>} key="account" />,
  // Legacy URLs kept working for anyone with an old link/bookmark -- the
  // standalone Profile page they used to point to no longer exists as a
  // separate page; the Global Account Hub supersedes it entirely.
  <Route path="/account/profile" element={<Navigate to="/account" replace />} key="account-profile-redirect" />,
  <Route path="/profile" element={<Navigate to="/account" replace />} key="profile-redirect" />,
];

export default accountRoutes;
