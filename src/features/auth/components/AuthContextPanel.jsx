import React from 'react';
import { useTranslation } from 'react-i18next';
import bookImage from '../../../images/book.png';

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 7V5a4 4 0 118 0v2h.5A1.5 1.5 0 0114 8.5v5A1.5 1.5 0 0112.5 15h-9A1.5 1.5 0 012 13.5v-5A1.5 1.5 0 013.5 7H4zm2 0h4V5a2 2 0 10-4 0v2z" />
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
          <img className="auth-context__image" src={bookImage} alt="" />
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
