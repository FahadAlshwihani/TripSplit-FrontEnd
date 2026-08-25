import React, { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_NAV_ITEMS, MOBILE_PRIMARY_KEYS } from './dashboardNav';

/*
  Mobile-only (hidden ≥768px via CSS). Exactly the four highest-frequency
  destinations plus More -- not every nav item crammed into five tiny
  slots, per the brief's own explicit anti-pattern warning.
*/
const MobileBottomNav = forwardRef(({ tripId, onOpenMore }, moreTriggerRef) => {
  const { t } = useTranslation();
  const primaryItems = MOBILE_PRIMARY_KEYS.map((key) => DASHBOARD_NAV_ITEMS.find((item) => item.key === key));

  return (
    <nav className="dash-bottom-nav" aria-label={t('dashboard.nav.groupLabel')}>
      {primaryItems.map((item) => (
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
