import React, { lazy } from 'react';
import { Navigate, Route, useLocation } from 'react-router-dom';
import GatedRoute from '../../auth/GatedRoute';

// Public routes: no trip membership or account required.
const Home = lazy(() => import('../../features/home/pages/HomePage'));
const Features = lazy(() => import('../../features/features/pages/FeaturesPage'));
const Pricing = lazy(() => import('../../features/pricing/pages/PricingPage'));
const CreateTrip = lazy(() => import('../../features/trips/pages/CreateTripPage'));
const JoinTrip = lazy(() => import('../../features/join/pages/JoinTripPage'));
const Auth = lazy(() => import('../../features/auth/pages/AuthPage'));
const Invitation = lazy(() => import('../../pages/InvitationPage'));
const JoinRequest = lazy(() => import('../../pages/JoinRequestPage'));
const About = lazy(() => import('../../pages/About'));

// Preserves the query string (?code=/?token= pre-fill) across the
// rename -- same Navigate-replace alias pattern as tripRoutes.jsx's
// legacy /trip/:code redirect.
const LegacyJoinTrip = () => {
  const location = useLocation();
  return <Navigate to={`/trips/join${location.search}`} replace />;
};

const publicRoutes = [
  <Route path="/" element={<Home />} key="home" />,
  <Route path="/features" element={<Features />} key="features" />,
  <Route path="/pricing" element={<Pricing />} key="pricing" />,
  <Route path="/create-trip" element={<GatedRoute><CreateTrip /></GatedRoute>} key="create-trip" />,
  <Route path="/trips/join" element={<GatedRoute><JoinTrip /></GatedRoute>} key="join-trip" />,
  <Route path="/join-trip" element={<LegacyJoinTrip />} key="join-trip-legacy" />,
  <Route path="/auth" element={<Auth />} key="auth" />,
  <Route path="/invite/:token" element={<Invitation />} key="invite" />,
  <Route path="/join-request/:requestId" element={<JoinRequest />} key="join-request" />,
  <Route path="/about" element={<About />} key="about" />,
];

export default publicRoutes;
