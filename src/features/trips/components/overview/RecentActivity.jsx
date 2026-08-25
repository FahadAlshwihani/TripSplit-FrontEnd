import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from '../../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../../profile/utils/avatarKey';
import { formatMoney, formatDate } from '../../../../shared/utils/format';

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

const RecentActivity = ({ events, currency, tripId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="ov-panel ov-panel--activity">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">
          <i className="bi bi-clock-history" aria-hidden="true" /> {t('dashboard.overview.recentActivity')}
        </h3>
        <button type="button" className="dash-btn dash-btn--secondary ov-panel__view-all" onClick={() => navigate(`/trips/${tripId}/activity`)}>
          {t('dashboard.overview.viewAll')}
        </button>
      </header>
      {events.length ? (
        <div className="ov-activity-list">
          <div className="ov-activity-list__head" aria-hidden="true">
            <span>{t('dashboard.overview.columnDescription')}</span>
            <span>{t('dashboard.overview.columnDate')}</span>
            <span>{t('dashboard.overview.columnAmount')}</span>
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
              <span className="ov-activity-row__date">{formatDate(event.created_at)}</span>
              <span className="ov-activity-row__amount">{event.summary.amount ? formatMoney(event.summary.amount, event.summary.currency || currency) : null}</span>
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
