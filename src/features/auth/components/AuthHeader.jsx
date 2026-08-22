import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from '../../../components/Layout/LanguageSwitch';
import ThemeSwitch from '../../../components/Layout/ThemeSwitch';

const AuthHeader = () => {
  const { t } = useTranslation();
  return (
    <header className="auth-header">
      <div className="auth-header__brand-group">
        <Link to="/" className="auth-header__brand text-display">{t('auth.brand')}</Link>
        <p className="auth-header__secure-label text-label">{t('auth.secureLabel')}</p>
      </div>
      <div className="auth-header__right">
        <div className="auth-header__status">
          <span className="auth-header__pulse" aria-hidden="true" />
          <span className="text-label">{t('auth.secureStatus')}</span>
        </div>
        <div className="auth-header__utilities">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
