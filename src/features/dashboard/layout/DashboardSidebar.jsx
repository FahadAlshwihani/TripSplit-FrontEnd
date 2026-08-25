import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_NAV_ITEMS, DASHBOARD_FOOTER_ITEMS, visibleNavItems } from './dashboardNav';
import { formatDateRange } from '../../../shared/utils/format';

const tripState = (trip) => {
  if (trip.archived_at) return { key: 'archived', label: 'dashboard.trip.state.archived' };
  if (trip.lifecycle_status === 'closed') return { key: 'closed', label: 'dashboard.trip.state.closed' };
  return { key: 'active', label: 'dashboard.trip.state.active' };
};

const DashboardSidebar = ({ trip, tripId, permissions }) => {
  const { t } = useTranslation();
  const state = tripState(trip);
  const dateRange = formatDateRange(trip.start_date, trip.end_date);

  return (
    <nav className="dash-sidebar" aria-label={t('dashboard.nav.groupLabel')}>
      <div className="dash-sidebar__trip">
        <div className="dash-sidebar__icon" aria-hidden="true"><i className="bi bi-compass" /></div>
        <div className="dash-sidebar__trip-text">
          <h2 className="dash-sidebar__trip-name text-headline-sm">{trip.title}</h2>
          {dateRange && <p className="dash-sidebar__trip-dates text-label">{dateRange}</p>}
          <span className={`dash-badge dash-badge--${state.key}`}>
            <span className="dash-badge__dot" aria-hidden="true" />
            {t(state.label)}
          </span>
        </div>
      </div>

      {/* Reuses the existing expense-creation flow rather than a second
          engine: the Expenses page already surfaces its QuickExpense
          form immediately at the top for anyone who can create expenses,
          with no extra signal needed to reveal it. */}
      <NavLink to={`/trips/${tripId}/expenses`} className="dash-btn dash-btn--primary dash-sidebar__cta">
        <i className="bi bi-plus-lg" aria-hidden="true" />
        {t('dashboard.newExpense')}
      </NavLink>

      <div className="dash-sidebar__nav">
        {visibleNavItems(DASHBOARD_NAV_ITEMS, permissions).map((item) => (
          <NavLink key={item.key} to={`/trips/${tripId}/${item.path}`} className={({ isActive }) => `dash-sidebar__link${isActive ? ' is-active' : ''}`}>
            <i className={`bi ${item.icon} dash-sidebar__link-icon`} aria-hidden="true" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </div>

      <div className="dash-sidebar__footer">
        {DASHBOARD_FOOTER_ITEMS.map((item) => (
          <NavLink key={item.key} to={`/trips/${tripId}/${item.path}`} className={({ isActive }) => `dash-sidebar__link${isActive ? ' is-active' : ''}`}>
            <i className={`bi ${item.icon} dash-sidebar__link-icon`} aria-hidden="true" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default DashboardSidebar;
