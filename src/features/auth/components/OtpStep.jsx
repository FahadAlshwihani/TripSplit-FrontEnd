import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OtpInput from './OtpInput';

const ArrowBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 8H3M7 4L3 8l4 4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.25" />
    <path d="M5.3 8.2l1.8 1.8 3.6-3.8" />
  </svg>
);

const OtpStep = ({ email, busy, error, resendSeconds, onSubmit, onResend, onBack }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (code.length !== 6) return;
    onSubmit(code);
  };

  return (
    <div className="auth-step">
      <button type="button" className="auth-step__back" onClick={onBack}>
        <ArrowBackIcon />
        <span className="text-label">{t('auth.otp.changeEmail')}</span>
      </button>
      <div className="auth-step__head">
        <h1 className="auth-step__heading text-headline-md">{t('auth.otp.heading')}</h1>
        <p className="auth-step__description text-copy">{t('auth.otp.description', { email })}</p>
        <p className="auth-step__notice text-copy-sm">{t('auth.otp.expiryHelper')}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <div className="auth-field__otp-head">
            <span className="auth-field__label text-label" id="auth-otp-label">{t('auth.otp.label')}</span>
            <button
              type="button"
              className="auth-resend text-label"
              onClick={onResend}
              disabled={resendSeconds > 0 || busy}
            >
              {resendSeconds > 0 ? t('auth.otp.resendCooldown', { time: `${resendSeconds}s` }) : t('auth.otp.resend')}
            </button>
          </div>
          <OtpInput value={code} onChange={setCode} disabled={busy} label={t('auth.otp.label')} />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-btn auth-btn--primary" disabled={busy || code.length !== 6}>
          <CheckCircleIcon />
          <span>{t('auth.otp.submit')}</span>
        </button>
      </form>
    </div>
  );
};

export default OtpStep;
