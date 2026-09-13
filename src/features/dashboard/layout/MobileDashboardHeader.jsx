import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRIP_IDENTITY_ICON } from './dashboardNav';
import { formatDateRange } from '../../../shared/utils/format';
import QuickActionsMenu from '../quick-actions/QuickActionsMenu';

/*
  Mobile-only (hidden ≥768px via CSS). Trip identity leads -- not the
  TripSplit wordmark, which the desktop top bar already carries and
  which would only compete with the one piece of context that actually
  matters once a member is inside a specific trip. Account/profile
  controls intentionally live only under Settings; this header keeps a
  single shared Quick Actions launcher. Trip switching is one tap away
  via a link to the Account hub's own trip
  history (already canonical) rather than a duplicate switcher; guests
  have no /account (registered-only), so that link only renders for a
  registered current member -- a guest is scoped to one trip by design.
*/
const MobileDashboardHeader = ({ trip, quickActions }) => {
  const { t } = useTranslation();
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
        <QuickActionsMenu surface="mobile" {...quickActions} />
      </div>
    </header>
  );
};

export default MobileDashboardHeader;
