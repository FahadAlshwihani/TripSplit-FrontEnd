import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PublicNav = () => {
  const { t } = useTranslation();
  return (
    <header className="public-nav">
      <div className="public-nav__inner">
        <Link to="/" className="public-nav__brand text-title">{t('home.nav.brand')}</Link>
        <nav className="public-nav__links" aria-label={t('home.nav.brand')}>
          <a className="public-nav__link text-label" href="#preview">{t('home.nav.features')}</a>
          <a className="public-nav__link text-label" href="#get-started">{t('home.nav.pricing')}</a>
          <Link className="public-nav__link public-nav__link--signin text-label" to="/auth">{t('home.nav.signIn')}</Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicNav;
