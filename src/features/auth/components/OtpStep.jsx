import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import OtpInput from './OtpInput';
import Spinner from './Spinner';

const ArrowBackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 8H3M7 4L3 8l4 4" />
  </svg>
);

const LockOpenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="1" />
    <path d="M5.5 7V4.5a2.5 2.5 0 014.7-1.2" />
  </svg>
);

// Stitch shows the cooldown as a zero-padded mm:ss clock ("00:42"), not the
// previous plain-seconds "45s" — RESEND_SECONDS (60, in AuthPage.jsx) never
// exceeds a couple of minutes, so minutes stays a single "0X" digit in
// practice, but the format handles any value correctly regardless.
const formatCountdown = (totalSeconds) => {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60).toString().padStart(2, '0');
  const seconds = (clamped % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

/*
  Standalone compact "brutalist ledger" card, matching the approved Stitch
  OTP reference exactly — deliberately its own full-viewport composition
  (no AuthHeader, no AuthContextPanel/editorial image), not a step nested
  inside the two-column shell the Email/Profile steps use. AuthPage.jsx
  renders this in place of the whole page when step === 'otp'.
*/
const OtpStep = ({ email, isVerifying, isResending, errorKey, resendSeconds, onSubmit, onResend, onBack }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isVerifying || code.length !== 6) return;
    onSubmit(code);
  };

  const resendDisabled = resendSeconds > 0 || isResending || isVerifying;

  return (
    <div className="otp-page">
      <div className="otp-card-wrap">
        <button
          type="button"
          className="otp-back"
          onClick={onBack}
          disabled={isVerifying}
          aria-label={t('auth.otp.back')}
        >
          <ArrowBackIcon />
        </button>
        <div className="otp-card">
          <header className="otp-card__header">
            <h1 className="otp-card__heading text-headline-lg">{t('auth.otp.title')}</h1>
            <p className="otp-card__description text-copy">
              <Trans
                i18nKey="auth.otp.description"
                values={{ email }}
                components={{ email: <span className="otp-card__email text-financial" dir="ltr" /> }}
              />
            </p>
          </header>
          <form className="otp-card__form" onSubmit={handleSubmit} noValidate>
            <div className="otp-card__field">
              <OtpInput value={code} onChange={setCode} disabled={isVerifying} label={t('auth.otp.label')} />
              <p className="otp-card__helper text-copy-sm">{t('auth.otp.expires')}</p>
              {errorKey && <p className="auth-error" role="alert">{t(errorKey)}</p>}
            </div>
            <div className="otp-card__actions">
              <button
                type="submit"
                className={`auth-btn auth-btn--primary${isVerifying ? ' auth-btn--loading' : ''}`}
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Spinner />
                    <span>{t('auth.otp.verifying')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.otp.verify')}</span>
                    <LockOpenIcon />
                  </>
                )}
              </button>
              <button
                type="button"
                className={`otp-resend text-label${isResending ? ' otp-resend--loading' : ''}`}
                onClick={onResend}
                disabled={resendDisabled}
              >
                {isResending ? (
                  <>
                    <Spinner />
                    <span>{t('auth.otp.resending')}</span>
                  </>
                ) : resendSeconds > 0 ? (
                  t('auth.otp.resendCountdown', { time: formatCountdown(resendSeconds) })
                ) : (
                  t('auth.otp.resend')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpStep;
