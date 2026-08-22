import React from 'react';
import { useTranslation } from 'react-i18next';

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 7V5a4 4 0 118 0v2h.5A1.5 1.5 0 0114 8.5v5A1.5 1.5 0 0112.5 15h-9A1.5 1.5 0 012 13.5v-5A1.5 1.5 0 013.5 7H4zm2 0h4V5a2 2 0 10-4 0v2z" />
  </svg>
);

/*
  No real editorial photograph is available yet (the Stitch mockup points
  at a temporary googleusercontent URL, which must not become a production
  dependency). Placeholder: a static, grayscale-toned abstract ledger
  glyph on a textured surface, matching the bordered/cream-framed
  composition — swap for a real asset when one is supplied.
*/
const LedgerGlyph = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="14" y="9" width="36" height="46" rx="1" />
    <line x1="14" y1="18" x2="50" y2="18" />
    <line x1="22" y1="27" x2="42" y2="27" />
    <line x1="22" y1="35" x2="42" y2="35" />
    <line x1="22" y1="43" x2="36" y2="43" />
  </svg>
);

const AuthContextPanel = () => {
  const { t } = useTranslation();
  return (
    <div className="auth-context">
      <div>
        <h2 className="auth-context__heading text-headline-lg">{t('auth.context.heading')}</h2>
        <p className="auth-context__description text-copy-lg">{t('auth.context.description')}</p>
      </div>
      <div className="auth-context__visual" aria-hidden="true">
        <div className="auth-context__visual-inner">
          <LedgerGlyph />
        </div>
        <span className="auth-context__badge text-financial">
          <LockIcon />
          {t('auth.imageBadge')}
        </span>
      </div>
    </div>
  );
};

export default AuthContextPanel;
