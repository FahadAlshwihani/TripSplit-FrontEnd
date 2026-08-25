import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/*
  Desktop-only (hidden below the dashboard's mobile breakpoint via CSS,
  same always-mounted/CSS-toggled pattern as PublicNav). Search has no
  backend search capability to wire into yet -- submitting it navigates
  to the Expenses list rather than faking filtered results, and the
  Expenses phase can replace this with real query wiring later without
  touching the shell.
*/
const DashboardTopBar = ({ tripId, permissions }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/trips/${tripId}/expenses`);
  };

  return (
    <header className="dash-topbar">
      <span className="dash-topbar__brand text-headline-md">{t('home.nav.brand')}</span>
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
        {permissions.canManageMembers && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={() => navigate(`/trips/${tripId}/governance`)}>
            <i className="bi bi-person-plus" aria-hidden="true" />
            <span className="dash-btn__label">{t('dashboard.addMember')}</span>
          </button>
        )}
        <button type="button" className="dash-btn dash-btn--primary" onClick={() => navigate(`/trips/${tripId}/expenses`)}>
          <i className="bi bi-lightning-charge" aria-hidden="true" />
          <span className="dash-btn__label">{t('dashboard.quickExpense')}</span>
        </button>
      </div>
    </header>
  );
};

export default DashboardTopBar;
