import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from '../../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../../profile/utils/avatarKey';
import { formatDate } from '../../../../shared/utils/format';
import Money from '../../../../shared/components/Money';

const rowDescription = (event, t) => {
  if (event.event_type === 'expense_created') return event.summary.title;
  return t('dashboard.overview.settlementLabel');
};

const rowContext = (event, t) => {
  if (event.event_type === 'expense_created') {
    const scopeLabel = event.summary.scope === 'personal' ? t('dashboard.overview.personalExpense') : t('dashboard.overview.sharedExpense');
    return t('dashboard.overview.paidBy', { name: event.actor?.display_name || '', scope: scopeLabel });
  }
  return t('dashboard.overview.settlementContext', { from: event.summary.from_name, to: event.summary.to_name });
};

const RecentActivity = ({ events, currency }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // In-app navigation link -- uses the trip's own short_code (the
  // canonical browser-URL form), never the outlet context's own
  // `tripId` (deliberately the UUID everywhere, for API calls only --
  // see TripLayout's own comment).
  const { trip } = useOutletContext();

  return (
    <section className="ov-panel ov-panel--activity">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">
          <i className="bi bi-clock-history" aria-hidden="true" /> {t('dashboard.overview.recentActivity')}
        </h3>
        <button type="button" className="dash-btn dash-btn--secondary ov-panel__view-all" onClick={() => navigate(`/trips/${trip.short_code}/activity`)}>
          {t('dashboard.overview.viewAll')}
        </button>
      </header>
      {events.length ? (
        <div className="ov-activity-list">
          <div className="ov-activity-list__head" aria-hidden="true">
            <span className="ov-activity-list__head-cell">{t('dashboard.overview.columnDescription')}</span>
            <span className="ov-activity-list__head-cell ov-activity-list__head-cell--center">{t('dashboard.overview.columnDate')}</span>
            <span className="ov-activity-list__head-cell ov-activity-list__head-cell--center">{t('dashboard.overview.columnAmount')}</span>
          </div>
          {events.map((event) => (
            <div className="ov-activity-row" key={event.id}>
              <div className="ov-activity-row__main">
                {event.actor && <Avatar avatarKey={avatarKeyFromAvatar(event.actor.avatar)} displayName={event.actor.display_name} size="sm" />}
                <div className="ov-activity-row__text">
                  <span className="ov-activity-row__title">{rowDescription(event, t)}</span>
                  <span className="ov-activity-row__context text-copy-sm">{rowContext(event, t)}</span>
                </div>
              </div>
              {/* One markup structure for both breakpoints: this wrapper
                  becomes `display: contents` at >=640px (see overview.css),
                  so date/amount fall straight into the grid's own Date/
                  Amount columns instead of needing separate mobile/desktop
                  markup -- it only does real layout work (a centered
                  2-column row) below that breakpoint. */}
              <div className="ov-activity-row__meta">
                <span className="ov-activity-row__date">{formatDate(event.created_at)}</span>
                {event.summary.amount && (
                  <Money value={event.summary.amount} currency={event.summary.currency || currency} variant="tabular" className="ov-activity-row__amount text-financial" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="ov-empty text-copy-sm">{t('dashboard.overview.noActivity')}</p>
      )}
    </section>
  );
};

export default RecentActivity;
