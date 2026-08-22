import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../api/authApi';
import { useAuth } from '../../../auth/AuthContext';
import { getSafeNext } from '../../../auth/safeNext';
import { getAuthErrorKey, getOtpErrorKey } from '../authErrors';
import AuthHeader from '../components/AuthHeader';
import AuthContextPanel from '../components/AuthContextPanel';
import EmailStep from '../components/EmailStep';
import OtpStep from '../components/OtpStep';
import ProfileStep from '../components/ProfileStep';
import '../styles/auth.css';

const RESEND_SECONDS = 60;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const next = getSafeNext(location.search);
  const guestAllowed = new URLSearchParams(location.search).get('guest') !== '0';
  const { setUser, saveProfile } = useAuth();

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
      setErrorKey(getAuthErrorKey(err, 'auth.errors.unknown'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const continueAsGuest = () => navigate(next, { state: { fromGateway: true } });

  // The OTP state is its own compact, standalone verification card (see
  // OtpStep.jsx) — not a step nested inside the two-column Email/Profile
  // shell below. It renders full-viewport with no AuthHeader/
  // AuthContextPanel, matching the approved Stitch reference exactly.
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

  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="auth-main">
        <AuthContextPanel />
        <div className="auth-form-area">
          <div className="auth-form-area__inner">
            {step === 'email' && (
              <EmailStep
                busy={isSendingOtp}
                errorKey={errorKey}
                guestAllowed={guestAllowed}
                onSubmit={submitEmail}
                onGuest={continueAsGuest}
              />
            )}
            {step === 'profile' && (
              <ProfileStep busy={isSavingProfile} errorKey={errorKey} onSubmit={submitProfile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
