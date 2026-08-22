import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestOtp, verifyOtp } from '../api/authApi';
import { useAuth } from '../../../auth/AuthContext';
import { getSafeNext } from '../../../auth/safeNext';
import AuthHeader from '../components/AuthHeader';
import AuthContextPanel from '../components/AuthContextPanel';
import EmailStep from '../components/EmailStep';
import OtpStep from '../components/OtpStep';
import ProfileStep from '../components/ProfileStep';
import '../styles/auth.css';

const RESEND_SECONDS = 60;

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const next = getSafeNext(location.search);
  const guestAllowed = new URLSearchParams(location.search).get('guest') !== '0';
  const { setUser, saveProfile } = useAuth();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const requestCode = async (targetEmail) => {
    setBusy(true);
    setError('');
    try {
      const result = await requestOtp(targetEmail);
      setEmail(targetEmail);
      setOtpId(result.otp_id);
      setStep('otp');
      setResendSeconds(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.email.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (code) => {
    setBusy(true);
    setError('');
    try {
      const result = await verifyOtp({ otp_id: otpId, email, code });
      setUser(result.user);
      if (result.onboarding_required) setStep('profile');
      else navigate(next);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.otp.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async (profile) => {
    setBusy(true);
    setError('');
    try {
      await saveProfile(profile);
      navigate(next);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.profile.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const continueAsGuest = () => navigate(next, { state: { fromGateway: true } });

  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="auth-main">
        <AuthContextPanel />
        <div className="auth-form-area">
          <div className="auth-form-area__inner">
            {step === 'email' && (
              <EmailStep
                busy={busy}
                error={error}
                guestAllowed={guestAllowed}
                onSubmit={requestCode}
                onGuest={continueAsGuest}
              />
            )}
            {step === 'otp' && (
              <OtpStep
                email={email}
                busy={busy}
                error={error}
                resendSeconds={resendSeconds}
                onSubmit={submitOtp}
                onResend={() => requestCode(email)}
                onBack={() => { setStep('email'); setError(''); }}
              />
            )}
            {step === 'profile' && (
              <ProfileStep busy={busy} error={error} onSubmit={submitProfile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
