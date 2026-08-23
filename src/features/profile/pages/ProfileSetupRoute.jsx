import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { getSafeNext } from '../../../auth/safeNext';
import { getProfileErrorKey } from '../../auth/authErrors';
import ProfileSetupPage from './ProfileSetupPage';

// Standalone /profile/setup — reachable directly (bookmarked, or a
// protected route redirecting here) rather than only inline in AuthPage's
// OTP flow. RequireOnboarding (the route guard) already ensures only an
// authenticated, incomplete-profile user ever renders this.
const ProfileSetupRoute = () => {
  const { saveProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const onSubmit = async (profile) => {
    setBusy(true);
    setErrorKey(null);
    try {
      await saveProfile(profile);
      navigate(getSafeNext(location.search, '/dashboard'));
    } catch (err) {
      setErrorKey(getProfileErrorKey(err));
    } finally {
      setBusy(false);
    }
  };

  return <ProfileSetupPage busy={busy} errorKey={errorKey} onSubmit={onSubmit} />;
};

export default ProfileSetupRoute;
