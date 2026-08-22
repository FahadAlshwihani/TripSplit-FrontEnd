import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';
import ThemeSwitch from './ThemeSwitch';

const PublicNav = () => {
  const { t } = useTranslation();
  return (
    <header className="public-nav">
      <div className="public-nav__inner">
        <Link to="/" className="public-nav__brand text-title">{t('home.nav.brand')}</Link>
        <nav className="public-nav__links" aria-label={t('home.nav.brand')}>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/features">{t('home.nav.features')}</Link>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/pricing">{t('home.nav.pricing')}</Link>
          <Link className="public-nav__link public-nav__link--signin text-label" to="/auth">{t('home.nav.signIn')}</Link>
          <div className="public-nav__utilities">
            <LanguageSwitch />
            <ThemeSwitch />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default PublicNav;
