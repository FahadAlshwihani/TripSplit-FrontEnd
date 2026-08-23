import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import GatedRoute from '../../auth/GatedRoute';

// Public routes: no trip membership or account required.
const Home = lazy(() => import('../../features/home/pages/HomePage'));
const Features = lazy(() => import('../../features/features/pages/FeaturesPage'));
const Pricing = lazy(() => import('../../features/pricing/pages/PricingPage'));
const CreateTrip = lazy(() => import('../../features/trips/pages/CreateTripPage'));
const JoinTrip = lazy(() => import('../../features/trips/pages/JoinTripPage'));
const Auth = lazy(() => import('../../features/auth/pages/AuthPage'));
const Invitation = lazy(() => import('../../pages/InvitationPage'));
const JoinRequest = lazy(() => import('../../pages/JoinRequestPage'));
const About = lazy(() => import('../../pages/About'));

const publicRoutes = [
  <Route path="/" element={<Home />} key="home" />,
  <Route path="/features" element={<Features />} key="features" />,
  <Route path="/pricing" element={<Pricing />} key="pricing" />,
  <Route path="/create-trip" element={<GatedRoute><CreateTrip /></GatedRoute>} key="create-trip" />,
  <Route path="/join-trip" element={<GatedRoute><JoinTrip /></GatedRoute>} key="join-trip" />,
  <Route path="/auth" element={<Auth />} key="auth" />,
  <Route path="/invite/:token" element={<Invitation />} key="invite" />,
  <Route path="/join-request/:requestId" element={<JoinRequest />} key="join-request" />,
  <Route path="/about" element={<About />} key="about" />,
];

export default publicRoutes;
