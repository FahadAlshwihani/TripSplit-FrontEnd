import React, { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import GatedRoute from '../../auth/GatedRoute';
import RequireOnboarding from '../../auth/RequireOnboarding';

// Account routes: authenticated-user pages, all behind the one canonical
// GatedRoute guard (next is derived from the current URL automatically —
// see GatedRoute) instead of each page inventing its own redirect.
const Profile = lazy(() => import('../../pages/ProfilePage'));
const Dashboard = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const ProfileSetupRoute = lazy(() => import('../../features/profile/pages/ProfileSetupRoute'));

const accountRoutes = [
  <Route path="/dashboard" element={<GatedRoute><Dashboard /></GatedRoute>} key="dashboard" />,
  <Route path="/profile/setup" element={<RequireOnboarding><ProfileSetupRoute /></RequireOnboarding>} key="profile-setup" />,
  <Route path="/account/profile" element={<GatedRoute><Profile /></GatedRoute>} key="account-profile" />,
  // Legacy URL kept working for anyone with an old link/bookmark.
  <Route path="/profile" element={<Navigate to="/account/profile" replace />} key="profile-redirect" />,
];

export default accountRoutes;
