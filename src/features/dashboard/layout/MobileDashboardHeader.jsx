import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AccountMenu from '../../../components/Layout/AccountMenu';
import { TRIP_IDENTITY_ICON } from './dashboardNav';
import { formatDateRange } from '../../../shared/utils/format';

/*
  Mobile-only (hidden ≥768px via CSS). Trip identity leads -- not the
  TripSplit wordmark, which the desktop top bar already carries and
  which would only compete with the one piece of context that actually
  matters once a member is inside a specific trip. Reuses the existing
  global AccountMenu instead of building a second identity control (not
  a second account hub, just the same one docked in here). Trip
  switching is one tap away via a link to the Account hub's own trip
  history (already canonical) rather than a duplicate switcher; guests
  have no /account (registered-only), so that link only renders for a
  registered current member -- a guest is scoped to one trip by design.
*/
const MobileDashboardHeader = ({ trip, tripId, permissions }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRegistered = trip.current_member?.identity_type === 'registered';
  const dateRange = formatDateRange(trip.start_date, trip.end_date);

  const TripIcon = <i className={`bi ${TRIP_IDENTITY_ICON} dash-mobile-header__trip-icon`} aria-hidden="true" />;
  const TripText = (
    <span className="dash-mobile-header__trip-text">
      <span className="dash-mobile-header__trip-name">{trip.title}</span>
      {dateRange && <span className="dash-mobile-header__trip-dates">{dateRange}</span>}
    </span>
  );

  return (
    <header className="dash-mobile-header">
      <div className="dash-mobile-header__identity">
        {isRegistered ? (
          // No aria-label override here -- that would replace the link's
          // accessible name with just "Switch trip" and discard the trip
          // title/dates a screen reader user actually needs to hear. The
          // visually-hidden prefix adds the switch-trip context in front
          // of the (still spoken) visible content instead of replacing it.
          <Link to="/account" className="dash-mobile-header__trip">
            {TripIcon}
            <span className="dash-visually-hidden">{t('dashboard.switchTrip')}: </span>
            {TripText}
            <i className="bi bi-chevron-expand dash-mobile-header__switch-icon" aria-hidden="true" />
          </Link>
        ) : (
          <span className="dash-mobile-header__trip">
            {TripIcon}
            {TripText}
          </span>
        )}
      </div>
      <div className="dash-mobile-header__actions">
        {permissions?.canManageMembers && (
          <button
            type="button"
            className="dash-btn dash-btn--secondary dash-mobile-header__action"
            aria-label={t('dashboard.addMember')}
            title={t('dashboard.addMember')}
            onClick={() => navigate(`/trips/${tripId}/governance`)}
          >
            <i className="bi bi-person-plus" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="dash-btn dash-btn--primary dash-mobile-header__action"
          aria-label={t('dashboard.newExpense')}
          title={t('dashboard.newExpense')}
          onClick={() => navigate(`/trips/${tripId}/expenses`)}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
        </button>
        <AccountMenu />
      </div>
    </header>
  );
};

export default MobileDashboardHeader;
