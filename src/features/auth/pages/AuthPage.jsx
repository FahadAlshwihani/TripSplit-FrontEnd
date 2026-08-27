import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestOtp, verifyOtp } from '../api/authApi';
import { useAuth } from '../../../auth/AuthContext';
import { getSafeNext } from '../../../auth/safeNext';
import { getAuthErrorKey, getOtpErrorKey, getProfileErrorKey } from '../authErrors';
import PublicLayout from '../../../components/Layout/PublicLayout';
import AuthContextPanel from '../components/AuthContextPanel';
import EmailStep from '../components/EmailStep';
import OtpStep from '../components/OtpStep';
import ProfileSetupPage from '../../profile/pages/ProfileSetupPage';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromUser } from '../../profile/utils/avatarKey';
import { loadGuestProfile, saveGuestProfile } from '../../../shared/guestProfileStore';
import { claimAllLocalGuestTrips } from '../../../shared/guestClaim';
import GuestTripsList from '../components/GuestTripsList';
import '../styles/auth.css';

const RESEND_SECONDS = 60;

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // No explicit ?next= means there was no pending intent (not "go Home") --
  // the Account hub is the global authenticated home post-login. Keep the
  // raw value too so the onboarding-redirect URL below only appends
  // ?next= when there was a REAL intent to preserve, not this default.
  const rawNext = getSafeNext(location.search);
  const next = rawNext === '/' ? '/account' : rawNext;
  const guestAllowed = new URLSearchParams(location.search).get('guest') !== '0';
  const { user, authLoading, setUser, saveProfile } = useAuth();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  // Stores an i18n KEY (e.g. "auth.errors.otpInvalid"), never a
  // pre-translated string — so a language switch while an error is
  // visible re-renders it in the new language instead of leaving it
  // stale. Step components call t(errorKey) themselves at render time.
  const [errorKey, setErrorKey] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  // SessionLifecycle (client-side idle detection) and the axios
  // interceptor (a server-confirmed session-expiry 401) both land an
  // anonymous visitor here with this router-state reason — shown once, on
  // the Email step, then not re-shown on a later re-render. The specific
  // code (when the server was the one that caught it) picks matching copy
  // instead of one generic "please sign in again" for every case — see
  // apps/accounts/middleware.py's IdleSessionMiddleware.
  useEffect(() => {
    const reason = location.state?.reason;
    if (reason === 'session_idle_timeout') setErrorKey('auth.errors.sessionIdleTimeout');
    else if (reason === 'session_revoked') setErrorKey('auth.errors.sessionRevoked');
    else if (reason === 'idle' || reason === 'session_expired') setErrorKey('auth.errors.sessionExpired');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCode = async (targetEmail, { setLoading, onErrorKey }) => {
    setLoading(true);
    setErrorKey(null);
    try {
      const result = await requestOtp(targetEmail);
      setEmail(targetEmail);
      setOtpId(result.otp_id);
      setStep('otp');
      setResendSeconds(RESEND_SECONDS);
    } catch (err) {
      setErrorKey(onErrorKey(err));
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = (targetEmail) => requestCode(targetEmail, {
    setLoading: setIsSendingOtp,
    onErrorKey: (err) => getAuthErrorKey(err, 'auth.errors.requestFailed'),
  });
  // Resend is only ever triggered from the standalone OTP card, so its
  // failures render through that card's own auth.otp.errors.* namespace
  // (falling back to the generic "server" copy) instead of the email
  // step's "couldn't send the verification code" phrasing.
  const resendCode = () => requestCode(email, {
    setLoading: setIsResendingOtp,
    onErrorKey: (err) => getOtpErrorKey(err, 'auth.otp.errors.server'),
  });

  const submitOtp = async (code) => {
    setIsVerifyingOtp(true);
    setErrorKey(null);
    try {
      const result = await verifyOtp({ otp_id: otpId, email, code });
      setUser(result.user);
      // Awaited (not fire-and-forget) so the merge-success notice it may
      // set is visible to whatever page we navigate to next -- but never
      // surfaces its own failure or blocks login on a claim error; a
      // device with no locally-known guest trips resolves this
      // immediately with zero network calls. See shared/guestClaim.js.
      await claimAllLocalGuestTrips();
      if (result.onboarding_required) setStep('profile');
      else navigate(next);
    } catch (err) {
      setErrorKey(getOtpErrorKey(err));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const submitProfile = async (profile) => {
    setIsSavingProfile(true);
    setErrorKey(null);
    try {
      await saveProfile(profile);
      navigate(next);
    } catch (err) {
      setErrorKey(getProfileErrorKey(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Guests get their own onboarding step (same profile/avatar component,
  // no email/OTP/account creation) instead of jumping straight to
  // Create/Join Trip — the destination page reads location.state.guestProfile
  // instead of showing its own inline name/avatar fields. A device that
  // already has a saved guest profile (shared/guestProfileStore.js) skips
  // straight to a "Continue as <name>" confirmation instead of asking the
  // guest to redo name/avatar setup from scratch every time.
  const continueAsGuest = () => setStep(loadGuestProfile() ? 'guest-returning' : 'guest-profile');
  const submitGuestProfile = (profile) => {
    saveGuestProfile(profile);
    // Guests have no /account (it's GatedRoute-protected, registered-only)
    // -- unlike the registered paths below, a guest with no real pending
    // intent falls back to Home, not Account, using the raw (un-remapped)
    // next so an unsafe/absent ?next= still lands somewhere guests can see.
    navigate(rawNext, { state: { fromGateway: true, guestProfile: profile } });
  };

  // An already-authenticated visitor opening /auth directly (not mid-flow —
  // step is still 'email', its initial value, so this never fires for a
  // user who just verified an OTP in THIS page instance) shouldn't be asked
  // for another OTP. Onboarding-incomplete still routes through Complete
  // Profile; otherwise continue to `next` if one was given, else the
  // Account hub -- the global authenticated home, no intermediate page.
  if (step === 'email' && !authLoading && user) {
    if (!user.onboarding_complete) {
      return <Navigate to={`/profile/setup${rawNext !== '/' ? `?next=${encodeURIComponent(rawNext)}` : ''}`} replace />;
    }
    return <Navigate to={next} replace />;
  }

  // OTP and Profile are each their own compact, standalone card (see
  // OtpStep.jsx / ProfileSetupPage.jsx) — not steps nested inside the
  // two-column Email shell below. Both render full-viewport with no
  // AuthHeader/AuthContextPanel, matching their approved Stitch
  // references exactly.
  if (step === 'otp') {
    return (
      <OtpStep
        email={email}
        isVerifying={isVerifyingOtp}
        isResending={isResendingOtp}
        errorKey={errorKey}
        resendSeconds={resendSeconds}
        onSubmit={submitOtp}
        onResend={resendCode}
        onBack={() => { setStep('email'); setErrorKey(null); }}
      />
    );
  }

  if (step === 'profile') {
    return <ProfileSetupPage busy={isSavingProfile} errorKey={errorKey} onSubmit={submitProfile} />;
  }

  if (step === 'guest-profile') {
    return <ProfileSetupPage busy={false} errorKey={null} onSubmit={submitGuestProfile} mode="guest" initialValues={loadGuestProfile()} onCancel={loadGuestProfile() ? () => setStep('guest-returning') : undefined} />;
  }

  if (step === 'guest-returning') {
    const persisted = loadGuestProfile();
    return (
      <PublicLayout>
        <div className="auth-main">
          <AuthContextPanel />
          <div className="auth-form-area">
            <div className="auth-form-area__inner auth-guest-returning">
              <Avatar avatarKey={avatarKeyFromUser(persisted)} displayName={persisted.display_name} size="lg" />
              <p className="auth-guest-returning__name text-copy-lg">{persisted.display_name}</p>
              <p className="text-copy-sm auth-guest-returning__notice">{t('guest.profileSavedNotice')}</p>
              <button type="button" className="auth-btn auth-btn--primary" onClick={() => submitGuestProfile(persisted)}>
                {t('guest.continueAs', { name: persisted.display_name })}
              </button>
              <button type="button" className="auth-btn" onClick={() => setStep('guest-profile')}>
                {t('guest.editProfile')}
              </button>
              <GuestTripsList />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="auth-main">
        <AuthContextPanel />
        <div className="auth-form-area">
          <div className="auth-form-area__inner">
            <EmailStep
              busy={isSendingOtp}
              errorKey={errorKey}
              guestAllowed={guestAllowed}
              onSubmit={submitEmail}
              onGuest={continueAsGuest}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AuthPage;
