import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../api/authApi';
import { useAuth } from '../../../auth/AuthContext';
import { getSafeNext } from '../../../auth/safeNext';
import { getAuthErrorKey, getOtpErrorKey, getProfileErrorKey } from '../authErrors';
import AuthHeader from '../components/AuthHeader';
import AuthContextPanel from '../components/AuthContextPanel';
import EmailStep from '../components/EmailStep';
import OtpStep from '../components/OtpStep';
import ProfileSetupPage from '../../profile/pages/ProfileSetupPage';
import '../styles/auth.css';

const RESEND_SECONDS = 60;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const next = getSafeNext(location.search);
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

  // SessionLifecycle (idle timeout) and GatedRoute (server session_expired)
  // both land an anonymous visitor here with this router-state reason —
  // shown once, on the Email step, then not re-shown on a later re-render.
  useEffect(() => {
    if (location.state?.reason === 'idle') setErrorKey('auth.errors.sessionExpired');
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
  // instead of showing its own inline name/avatar fields.
  const continueAsGuest = () => setStep('guest-profile');
  const submitGuestProfile = (profile) => navigate(next, { state: { fromGateway: true, guestProfile: profile } });

  // An already-authenticated visitor opening /auth directly (not mid-flow —
  // step is still 'email', its initial value, so this never fires for a
  // user who just verified an OTP in THIS page instance) shouldn't be asked
  // for another OTP. Onboarding-incomplete still routes through Complete
  // Profile; otherwise continue to `next` if one was given, else Dashboard.
  if (step === 'email' && !authLoading && user) {
    if (!user.onboarding_complete) {
      return <Navigate to={`/profile/setup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} replace />;
    }
    return <Navigate to={next !== '/' ? next : '/dashboard'} replace />;
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
    return <ProfileSetupPage busy={false} errorKey={null} onSubmit={submitGuestProfile} mode="guest" />;
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="auth-main">
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
      </main>
    </div>
  );
};

export default AuthPage;
