import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import { DASHBOARD_NAV_ITEMS, DASHBOARD_FOOTER_ITEMS, resolveMobileFavorites, visibleNavItems } from './dashboardNav';

/*
  Everything NOT already one tap away as a bottom-nav favorite.
  Portaled to document.body (same architecture as TripMoreActionsMenu/
  ModalPortal elsewhere) so it's never clipped by or trapped inside a
  transformed ancestor, and uses the shared modal z-index token rather
  than an ad-hoc number.
*/
const DashboardMoreSheet = ({ tripId, favorites, permissions, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const sheetRef = useRef(null);
  const firstItemRef = useRef(null);

  // Moves focus into the sheet on open (first destination link) --
  // focus never silently stays on a now-hidden-behind-the-overlay
  // trigger. DashboardShell restores focus to the "More" button itself
  // once this unmounts (see its onCloseMore).
  useEffect(() => { firstItemRef.current?.focus(); }, []);

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

  const favoriteKeys = resolveMobileFavorites(favorites);
  const secondaryItems = visibleNavItems(DASHBOARD_NAV_ITEMS, permissions).filter((item) => !favoriteKeys.includes(item.key));

  return (
    <ModalPortal>
      <div className="dash-more-overlay" role="presentation" onClick={onClose}>
        <div
          ref={sheetRef}
          className="dash-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dash-more-sheet-heading"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="dash-more-sheet__handle" aria-hidden="true" />
          <h2 id="dash-more-sheet-heading" className="dash-more-sheet__heading text-headline-sm">{t('dashboard.more')}</h2>
          <div className="dash-more-sheet__items">
            {secondaryItems.map((item, index) => (
              <NavLink key={item.key} ref={index === 0 ? firstItemRef : undefined} to={`/trips/${tripId}/${item.path}`} className="dash-more-sheet__item">
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
