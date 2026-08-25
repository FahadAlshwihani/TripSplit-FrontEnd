import React, { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_NAV_ITEMS, resolveMobileFavorites } from './dashboardNav';

/*
  Mobile-only (hidden ≥768px via CSS). Exactly three favorite
  destinations plus More -- not every nav item crammed into tiny slots
  (an explicit mobile anti-pattern), and not hand-written as three
  separate JSX blocks -- `favorites` is a plain key array so a future
  Settings screen can override which three render here without this
  component changing at all.
*/
const MobileBottomNav = forwardRef(({ tripId, favorites, onOpenMore }, moreTriggerRef) => {
  const { t } = useTranslation();
  const favoriteItems = resolveMobileFavorites(favorites)
    .map((key) => DASHBOARD_NAV_ITEMS.find((item) => item.key === key))
    .filter(Boolean);

  return (
    <nav className="dash-bottom-nav" aria-label={t('dashboard.nav.groupLabel')}>
      {favoriteItems.map((item) => (
        <NavLink key={item.key} to={`/trips/${tripId}/${item.path}`} className={({ isActive }) => `dash-bottom-nav__item${isActive ? ' is-active' : ''}`}>
          <i className={`bi ${item.icon}`} aria-hidden="true" />
          <span className="dash-bottom-nav__label">{t(item.labelKey)}</span>
        </NavLink>
      ))}
      <button ref={moreTriggerRef} type="button" className="dash-bottom-nav__item" onClick={onOpenMore} aria-haspopup="true">
        <i className="bi bi-three-dots" aria-hidden="true" />
        <span className="dash-bottom-nav__label">{t('dashboard.more')}</span>
      </button>
    </nav>
  );
});

export default MobileBottomNav;
