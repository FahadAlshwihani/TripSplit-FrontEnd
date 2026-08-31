import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';

const ROUND_STATUS_TONE = { open: 'neutral', completed: 'success', cancelled: 'muted' };

/*
  Overview's SOLE budget presentation -- the Trip Fund IS the trip
  budget (see docs/architecture/fund-accounting.md, "The Trip Fund is
  the budget"); there is no separate Total Budget card elsewhere on this
  page any more. Leads with the budget target itself, then collection
  progress, available cash, and just enough of the spent/reimbursed/
  refunded/shortfall breakdown to explain why available differs from
  collected, plus a compact (non-cancelled) funding-rounds list as pure
  history -- never implying a round defines the target.

  A trip with no Fund yet, or a Fund whose target hasn't been set (0,
  the same "not configured" sentinel Trip.budget used to carry), shows
  a compact zero-state prompt instead of the full breakdown -- never a
  blank space with no explanation of where the budget went.
*/
const FundSnapshot = ({ fund, roundsSummary, currency, tripId }) => {
  const { t } = useTranslation();
  const hasTarget = Boolean(fund?.has_fund) && Number(fund.total_target) > 0;

  if (!hasTarget) {
    return (
      <section className="ov-panel ov-panel--fund">
        <header className="ov-panel__head">
          <h3 className="ov-panel__title text-headline-sm"><i className="bi bi-piggy-bank" aria-hidden="true" /> {t('fund.budgetTarget')}</h3>
        </header>
        <div className="ov-panel__body ov-fund-empty">
          <p className="text-copy-sm">{t('fund.budgetNotSetYet')}</p>
          <Link className="dash-btn dash-btn--primary" to={`/trips/${tripId}/fund`}>{t('fund.editBudget')}</Link>
        </div>
      </section>
    );
  }

  const shortfall = Number(fund.shortfall) > 0;

  return (
    <section className="ov-panel ov-panel--fund">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm"><i className="bi bi-piggy-bank" aria-hidden="true" /> {t('fund.budgetTarget')}</h3>
        <Link className="ov-link" to={`/trips/${tripId}/fund`}>{t('dashboard.overview.viewDetails')}</Link>
      </header>
      <div className="ov-panel__body">
        <Money value={fund.total_target} currency={currency} className="ov-fund-target-value" currencyClassName="ov-fund-target-value-currency" />

        {shortfall && (
          <div className="ov-fund-shortfall" role="alert">
            <span><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {t('dashboard.overview.fundShortfall')}</span>
            <Money value={fund.shortfall} currency={currency} variant="tabular" className="ov-fund-shortfall__amount" />
            <Link className="dash-btn dash-btn--danger" to={`/trips/${tripId}/fund`}>{t('dashboard.overview.coverShortfall')}</Link>
          </div>
        )}

        <div className="ov-fund-progress">
          <div className="ov-fund-progress__head">
            <span className="text-label">{t('dashboard.overview.fundCollected')}</span>
            <span className="text-copy-sm">
              <Money value={fund.collected} currency={currency} variant="tabular" />
              {' / '}
              <Money value={fund.total_target} currency={currency} variant="tabular" />
              {' · '}{fund.collection_percent}%
            </span>
          </div>
          <div className="ov-fund-progress__track">
            <div className="ov-fund-progress__fill" style={{ width: `${Math.min(fund.collection_percent, 100)}%` }} />
          </div>
          {Number(fund.collection_remaining) > 0 && (
            <p className="ov-fund-progress__remaining text-copy-sm">
              {t('dashboard.overview.remainingToCollect')} <Money value={fund.collection_remaining} currency={currency} variant="tabular" />
            </p>
          )}
        </div>

        <div className="ov-fund-metrics">
          <div className="ov-fund-metric">
            <span className="text-label">{t('dashboard.overview.fundAvailable')}</span>
            <Money value={fund.available} currency={currency} variant="tabular" className={Number(fund.available) < 0 ? 'ov-fund-metric__value--danger' : undefined} />
          </div>
          <div className="ov-fund-metric">
            <span className="text-label">{t('dashboard.overview.fundSpent')}</span>
            <Money value={fund.spent_from_fund} currency={currency} variant="tabular" />
          </div>
          <div className="ov-fund-metric">
            <span className="text-label">{t('dashboard.overview.fundReimbursed')}</span>
            <Money value={fund.reimbursed} currency={currency} variant="tabular" />
          </div>
          <div className="ov-fund-metric">
            <span className="text-label">{t('dashboard.overview.fundRefunded')}</span>
            <Money value={fund.refunded} currency={currency} variant="tabular" />
          </div>
        </div>

        {roundsSummary.length > 0 && (
          <ul className="ov-fund-rounds">
            {roundsSummary.map((round) => (
              <li className="ov-fund-rounds__row" key={round.id}>
                <span className="ov-fund-rounds__title">{round.title}</span>
                <Money value={round.target_amount} currency={currency} variant="tabular" />
                <span className={`ov-fund-rounds__status ov-fund-rounds__status--${ROUND_STATUS_TONE[round.status] || 'neutral'}`}>{t(`fund.status.${round.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default FundSnapshot;
