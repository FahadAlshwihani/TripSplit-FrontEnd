import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';
import ThemeSwitch from './ThemeSwitch';
import AccountMenu from './AccountMenu';
import { useAuth } from '../../auth/AuthContext';

const PublicNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  // Defensive fallback: PublicNav is a shared leaf layout component used by
  // pages some tests render without an AuthProvider ancestor (it used to be
  // fully auth-agnostic). Treat a missing provider as "still loading"
  // rather than crashing.
  const { isAuthenticated, authLoading } = useAuth() || { authLoading: true };
  // A signed-out visitor already on the Sign In screen doesn't need a link
  // back to the page they're standing on -- the nav structure stays the
  // same either way, this control is just omitted rather than pointing at
  // itself.
  const onAuthPage = location.pathname === '/auth';
  return (
    <header className="public-nav">
      <div className="public-nav__inner">
        <Link to="/" className="public-nav__brand text-title">{t('home.nav.brand')}</Link>
        <nav className="public-nav__links" aria-label={t('home.nav.brand')}>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/features">{t('home.nav.features')}</Link>
          <Link className="public-nav__link public-nav__link--secondary text-label" to="/pricing">{t('home.nav.pricing')}</Link>
          {/* The identity-dependent control (Sign In link vs. account menu)
              is suppressed while auth is still restoring, rather than
              flashing Sign In and then flipping to the account menu once
              /auth/me/ resolves. The standalone theme/language utilities
              below are identity-agnostic and stay visible in that same
              window -- only once we KNOW the visitor is authenticated do
              they move into the account menu instead (which persists them
              server-side via usePreferenceSave), so there's never a
              duplicated pair of controls for an authenticated visitor. */}
          {authLoading ? null : isAuthenticated ? (
            <AccountMenu />
          ) : onAuthPage ? null : (
            <Link className="public-nav__link public-nav__link--signin text-label" to="/auth">{t('home.nav.signIn')}</Link>
          )}
          {!isAuthenticated && (
            <div className="public-nav__utilities">
              <LanguageSwitch />
              <ThemeSwitch />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default PublicNav;
