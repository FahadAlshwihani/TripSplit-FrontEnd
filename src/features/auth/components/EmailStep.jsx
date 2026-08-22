import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';
import MobileEditorialImage from './MobileEditorialImage';

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

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="5" r="2.75" />
    <path d="M2.5 14c.6-3 2.7-4.5 5.5-4.5S13.4 11 14 14" />
  </svg>
);

const EmailStep = ({ busy, errorKey, guestAllowed, onSubmit, onGuest }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  // A KEY, not a translated string — see AuthPage's errorKey for why.
  const [fieldErrorKey, setFieldErrorKey] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldErrorKey('auth.errors.invalidEmail');
      return;
    }
    setFieldErrorKey(null);
    onSubmit(trimmed);
  };

  const visibleErrorKey = fieldErrorKey || errorKey;

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
        {visibleErrorKey && <p className="auth-error" role="alert">{t(visibleErrorKey)}</p>}
        <button
          type="submit"
          className={`auth-btn auth-btn--primary${busy ? ' auth-btn--loading' : ''}`}
          disabled={busy}
        >
          {busy ? (
            <>
              <Spinner />
              <span>{t('auth.email.sending')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.email.submit')}</span>
              <ArrowForwardIcon />
            </>
          )}
        </button>
      </form>
      {/*
        Desktop Stitch presents "Continue as guest" as a small text link
        sharing one compact footer row with "Back to Home" — not a
        full-width bordered button. Mobile Stitch keeps it as a full-width
        secondary action instead. Rather than rendering two separate
        controls (one hidden), this is a single button whose *presentation*
        changes per breakpoint in CSS (order/width/border/shadow), so
        there's exactly one focusable "Continue as guest" control in the
        DOM at any width. The helper copy becomes an accessible description
        on desktop (still available to screen readers, not visible) and a
        small visible caption on mobile, matching each Stitch composition.
      */}
      <div className="auth-form-footer">
        <Link to="/" className="auth-footer__link text-label">
          <ArrowBackIcon />
          <span>{t('auth.backToHome')}</span>
        </Link>
        {guestAllowed && (
          <>
            <button
              type="button"
              className="auth-guest-action text-label"
              onClick={onGuest}
              aria-describedby="auth-guest-helper"
            >
              <span>{t('auth.guest.action')}</span>
              <PersonIcon />
            </button>
            <p id="auth-guest-helper" className="auth-guest__helper text-copy-sm">{t('auth.guest.helper')}</p>
          </>
        )}
      </div>
      <MobileEditorialImage />
    </div>
  );
};

export default EmailStep;
