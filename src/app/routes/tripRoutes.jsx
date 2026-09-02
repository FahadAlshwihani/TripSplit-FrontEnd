import React, { lazy } from 'react';
import { Navigate, Route, useParams } from 'react-router-dom';
import TripLayout from '../../layouts/TripLayout';

// Trip workspace routes: protected by trip access/membership logic that
// already lives in TripLayout (it fetches the trip and renders an
// ErrorState for 403/404/banned/expired-guest-access instead of the
// workspace), so no separate TripAccessRoute wrapper is added here.
const Overview = lazy(() => import('../../features/trips/pages/TripOverviewPage'));
const Expenses = lazy(() => import('../../features/expenses/pages/ExpensesPage'));
const Balances = lazy(() => import('../../features/balances/pages/BalancesPage'));
const Fund = lazy(() => import('../../features/funds/pages/FundPage'));
const Members = lazy(() => import('../../features/members/pages/MembersPage'));
const Governance = lazy(() => import('../../features/governance/pages/GovernancePage'));
const Categories = lazy(() => import('../../features/categories/pages/CategoriesPage'));
const Settlements = lazy(() => import('../../features/settlements/pages/SettlementsPage'));
const Activity = lazy(() => import('../../features/activity/pages/ActivityPage'));
const Settings = lazy(() => import('../../features/trips/pages/TripSettingsPage'));
const Support = lazy(() => import('../../features/trips/pages/TripSupportPage'));
const SupportArticle = lazy(() => import('../../features/support/pages/SupportArticlePage'));

const LegacyTrip = () => {
  const { code } = useParams();
  return <Navigate to={`/trips/${code}/overview`} replace />;
};

const tripRoutes = [
  <Route path="/trip/:code/*" element={<LegacyTrip />} key="legacy-trip" />,
  <Route path="/trips/:tripId" element={<TripLayout />} key="trip-workspace">
    <Route index element={<Navigate to="overview" replace />} />
    <Route path="overview" element={<Overview />} />
    <Route path="expenses" element={<Expenses />} />
    <Route path="balances" element={<Balances />} />
    <Route path="fund" element={<Fund />} />
    <Route path="members" element={<Members />} />
    <Route path="governance" element={<Governance />} />
    <Route path="invitations" element={<Navigate to="../governance" replace />} />
    <Route path="categories" element={<Categories />} />
    <Route path="settlements" element={<Settlements />} />
    <Route path="activity" element={<Activity />} />
    <Route path="settings" element={<Settings />} />
    <Route path="support" element={<Support />} />
    <Route path="support/:category" element={<SupportArticle />} />
  </Route>,
];

export default tripRoutes;
