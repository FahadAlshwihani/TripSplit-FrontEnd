import React from 'react';
import { useTranslation } from 'react-i18next';

const POLICY_ICONS = { open: 'bi-globe2', approval_required: 'bi-shield-check', invite_only: 'bi-envelope' };

const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  const format = (value) => (value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '?');
  return `${format(start)} – ${format(end)}`;
};

// Shared between JoinTripPage (code/link lookup) and InvitationPage
// (direct invitation) -- both render the exact same safe trip-preview
// shape from the same capability response, so there's one definition of
// what "safe to show before membership" looks like, not two.
const TripJoinPreview = ({ trip }) => {
  const { t } = useTranslation();
  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  return (
    <section className="jt-found-panel">
      <header className="jt-found-panel__header">
        <span className="text-label">{t('joinTrip.tripFound')}</span>
        <i className="bi bi-check-circle-fill jt-found-panel__check" aria-hidden="true" />
      </header>
      <div className="jt-found-panel__body">
        <h2 className="jt-found-panel__title text-title">{trip.title}</h2>
        {dateRange && (
          <p className="jt-found-panel__dates text-copy-sm">
            <i className="bi bi-calendar3" aria-hidden="true" />
            {dateRange}
          </p>
        )}
        <div className="jt-found-panel__grid">
          <div>
            <span className="text-label">{t('joinTrip.baseCurrency')}</span>
            <bdi className="text-copy">{trip.currency}</bdi>
          </div>
          <div>
            <span className="text-label">{t('joinTrip.members')}</span>
            <span className="text-copy">{trip.member_count}</span>
          </div>
        </div>
        <div className="jt-found-panel__policy">
          <span className="text-label">{t('joinTrip.joinPolicyLabel')}</span>
          <span className="text-copy-sm">
            <i className={`bi ${POLICY_ICONS[trip.join_policy]}`} aria-hidden="true" />
            {t(`joinPolicy.${trip.join_policy}`)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default TripJoinPreview;
