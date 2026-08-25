import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AccountMenu from '../../../components/Layout/AccountMenu';

/*
  Mobile-only (hidden ≥768px via CSS). Reuses the existing global
  AccountMenu instead of building a second identity control -- this is
  not a second account hub, just the same one docked into the mobile
  dashboard header. Trip switching is one tap away via a link to the
  Account hub's own trip history (already the canonical place trips are
  listed/switched from) rather than a duplicate trip-switcher UI here;
  guests have no /account (registered-only), so the link only renders
  for a registered current member -- a guest is scoped to one trip by
  design, so "switching" isn't meaningful for them anyway.
*/
const MobileDashboardHeader = ({ trip, tripId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRegistered = trip.current_member?.identity_type === 'registered';

  return (
    <header className="dash-mobile-header">
      <div className="dash-mobile-header__identity">
        {isRegistered ? (
          // No aria-label override here -- that would replace the link's
          // accessible name with just "Switch trip" and discard the trip
          // title a screen reader user actually needs to hear. The
          // visually-hidden prefix adds the switch-trip context in front
          // of the (still spoken) visible trip name instead of instead
          // of it.
          <Link to="/account" className="dash-mobile-header__trip">
            <i className="bi bi-compass dash-mobile-header__trip-icon" aria-hidden="true" />
            <span className="dash-visually-hidden">{t('dashboard.switchTrip')}: </span>
            <span className="dash-mobile-header__trip-name text-headline-sm">{trip.title}</span>
            <i className="bi bi-chevron-expand dash-mobile-header__switch-icon" aria-hidden="true" />
          </Link>
        ) : (
          <span className="dash-mobile-header__trip">
            <i className="bi bi-compass dash-mobile-header__trip-icon" aria-hidden="true" />
            <span className="dash-mobile-header__trip-name text-headline-sm">{trip.title}</span>
          </span>
        )}
      </div>
      <div className="dash-mobile-header__actions">
        <button
          type="button"
          className="dash-btn dash-btn--primary dash-mobile-header__new-expense"
          aria-label={t('dashboard.newExpense')}
          onClick={() => navigate(`/trips/${tripId}/expenses`)}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          <span className="dash-btn__label" aria-hidden="true">{t('dashboard.newExpense')}</span>
        </button>
        <AccountMenu />
      </div>
    </header>
  );
};

export default MobileDashboardHeader;
