import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import { DASHBOARD_NAV_ITEMS, DASHBOARD_FOOTER_ITEMS, MOBILE_PRIMARY_KEYS, visibleNavItems } from './dashboardNav';

/*
  Everything NOT already one tap away on the bottom nav (Overview/
  Expenses/Fund/Members). Portaled to document.body (same architecture
  as TripMoreActionsMenu/ModalPortal elsewhere) so it's never clipped by
  or trapped inside a transformed ancestor, and uses the shared modal
  z-index token rather than an ad-hoc number.
*/
const DashboardMoreSheet = ({ tripId, permissions, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const sheetRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Route change (an item was followed) closes the sheet, same as the
  // trip more-actions popover's own close-on-navigation behavior. Unlike
  // that popover, this component is only ever mounted while open (see
  // DashboardShell's `{moreOpen && <DashboardMoreSheet .../>}`), so a
  // plain `useEffect(..., [location.pathname])` would also fire once on
  // that very first mount and close the sheet immediately after opening
  // it -- the ref skips exactly that first run.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const secondaryItems = visibleNavItems(DASHBOARD_NAV_ITEMS, permissions).filter((item) => !MOBILE_PRIMARY_KEYS.includes(item.key));

  return (
    <ModalPortal>
      <div className="dash-more-overlay" role="presentation" onClick={onClose}>
        <div
          ref={sheetRef}
          className="dash-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={t('dashboard.more')}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="dash-more-sheet__handle" aria-hidden="true" />
          <div className="dash-more-sheet__items">
            {secondaryItems.map((item) => (
              <NavLink key={item.key} to={`/trips/${tripId}/${item.path}`} className="dash-more-sheet__item">
                <i className={`bi ${item.icon} dash-more-sheet__item-icon`} aria-hidden="true" />
                {t(item.labelKey)}
              </NavLink>
            ))}
            {DASHBOARD_FOOTER_ITEMS.map((item) => (
              <NavLink key={item.key} to={`/trips/${tripId}/${item.path}`} className="dash-more-sheet__item">
                <i className={`bi ${item.icon} dash-more-sheet__item-icon`} aria-hidden="true" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </div>
          <button type="button" className="dash-btn dash-btn--secondary dash-more-sheet__close" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default DashboardMoreSheet;
