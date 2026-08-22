import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="3" width="13" height="10" rx="1" />
    <path d="M2 4l6 5 6-5" />
  </svg>
);

const ArrowForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 8h11M9 4l4 4-4 4" />
  </svg>
);

const ArrowBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 8H3M7 4L3 8l4 4" />
  </svg>
);

const EmailStep = ({ busy, error, guestAllowed, onSubmit, onGuest }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError(t('auth.email.invalid'));
      return;
    }
    setFieldError('');
    onSubmit(trimmed);
  };

  return (
    <div className="auth-step">
      <div className="auth-step__head">
        <h1 className="auth-step__heading text-headline">{t('auth.email.heading')}</h1>
        <p className="auth-step__description text-copy">{t('auth.email.description')}</p>
        {!guestAllowed && <p className="auth-step__notice text-copy-sm">{t('auth.invitation.signInRequired')}</p>}
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-field__label text-label" htmlFor="auth-email">{t('auth.email.label')}</label>
          {/* dir="ltr" on the whole control, not just the input: email
              addresses stay LTR content even on an RTL page, and the icon
              is absolutely positioned via logical (inset-inline-end)
              properties, which resolve against the direction of the
              element they're on — without this, the icon would resolve
              against the page's RTL direction while the text stays LTR,
              colliding at the same physical edge instead of the icon
              sitting past the text's actual end. */}
          <div className="auth-field__control" dir="ltr">
            <input
              id="auth-email"
              className="auth-field__input text-financial"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.email.placeholder')}
              autoComplete="email"
              required
            />
            <MailIcon />
          </div>
        </div>
        {(fieldError || error) && <p className="auth-error" role="alert">{fieldError || error}</p>}
        <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
          <span>{t('auth.email.submit')}</span>
          <ArrowForwardIcon />
        </button>
      </form>
      {guestAllowed && (
        <div className="auth-guest">
          <button type="button" className="auth-btn auth-btn--secondary" onClick={onGuest}>
            {t('auth.guest.action')}
          </button>
          <p className="auth-guest__helper text-copy-sm">{t('auth.guest.helper')}</p>
        </div>
      )}
      <div className="auth-footer">
        <Link to="/" className="auth-footer__link text-label">
          <ArrowBackIcon />
          {t('auth.backToHome')}
        </Link>
      </div>
    </div>
  );
};

export default EmailStep;
