import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_NAV_ITEMS, DASHBOARD_FOOTER_ITEMS } from './dashboardNav';
import QuickActionsMenu from '../quick-actions/QuickActionsMenu';

const CONTEXT_ROUTES = [...DASHBOARD_NAV_ITEMS, ...DASHBOARD_FOOTER_ITEMS];

/*
  Desktop-only (hidden below the dashboard's mobile breakpoint via CSS,
  same always-mounted/CSS-toggled pattern as PublicNav). Search has no
  backend search capability to wire into yet -- submitting it navigates
  to the Expenses list rather than faking filtered results, and the
  Expenses phase can replace this with real query wiring later without
  touching the shell.

  The brand wordmark used to sit here, but once a member is inside a
  trip it's dead weight -- what they actually need at a glance is which
  trip and which page. `/trips/:tripId/:segment` puts the active
  destination at a fixed path index, so the current label is read off
  the same canonical dashboardNav metadata every other nav surface
  uses, never hardcoded per route.
*/
const DashboardTopBar = ({ trip, tripId, quickActions }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const activeSegment = location.pathname.split('/')[3];
  const activeRoute = CONTEXT_ROUTES.find((item) => item.path === activeSegment);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/trips/${tripId}/expenses`);
  };

  return (
    <header className="dash-topbar">
      <div className="dash-topbar__context">
        <span className="dash-topbar__context-trip">{trip.title}</span>
        {activeRoute && (
          <>
            <span className="dash-topbar__context-sep" aria-hidden="true">/</span>
            <span className="dash-topbar__context-page">{t(activeRoute.labelKey)}</span>
          </>
        )}
      </div>
      <div className="dash-topbar__actions">
        <form className="dash-topbar__search" role="search" onSubmit={submitSearch}>
          <i className="bi bi-search dash-topbar__search-icon" aria-hidden="true" />
          <label className="dash-visually-hidden" htmlFor="dash-search">{t('dashboard.searchPlaceholder')}</label>
          <input
            id="dash-search"
            type="search"
            className="dash-topbar__search-input"
            placeholder={t('dashboard.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <QuickActionsMenu surface="desktop" {...quickActions} />
      </div>
    </header>
  );
};

export default DashboardTopBar;
