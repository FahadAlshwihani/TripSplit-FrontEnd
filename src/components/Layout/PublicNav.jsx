import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';
import ThemeSwitch from './ThemeSwitch';
import { useAuth } from '../../auth/AuthContext';

const PublicNav = () => {
  const { t } = useTranslation();
  // Defensive fallback: PublicNav is a shared leaf layout component used by
  // pages some tests render without an AuthProvider ancestor (it used to be
  // fully auth-agnostic). Treat a missing provider as "still loading"
  // rather than crashing.
  const { isAuthenticated, authLoading } = useAuth() || { authLoading: true };
  return (
    <header className="public-nav">
      <div className="public-nav__inner">
        <Link to="/" className="public-nav__brand text-title">{t('home.nav.brand')}</Link>
        <nav className="public-nav__links" aria-label={t('home.nav.brand')}>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/features">{t('home.nav.features')}</Link>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/pricing">{t('home.nav.pricing')}</Link>
          {/* Suppressed while auth is still restoring, rather than flashing
              Sign In and then flipping to Dashboard once /auth/me/ resolves. */}
          {authLoading ? null : isAuthenticated ? (
            <Link className="public-nav__link public-nav__link--signin text-label" to="/dashboard">{t('home.nav.dashboard')}</Link>
          ) : (
            <Link className="public-nav__link public-nav__link--signin text-label" to="/auth">{t('home.nav.signIn')}</Link>
          )}
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
