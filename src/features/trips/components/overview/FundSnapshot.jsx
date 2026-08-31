import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';

const ROUND_STATUS_TONE = { open: 'neutral', completed: 'success', cancelled: 'muted' };

/*
  Overview's compact Fund-aware summary -- the trip's budget IS the
  Fund's funding target (see docs/architecture/fund-accounting.md), so
  this panel exists to make that visible without duplicating the Fund
  page's own full ledger: collection progress, available cash, and just
  enough of the spent/reimbursed/refunded/shortfall breakdown to explain
  WHY available differs from collected, plus a compact (non-cancelled)
  funding-rounds list explaining WHY the target is what it is. Only
  rendered once a Fund actually exists (fund.has_fund) -- a trip that
  never set one up sees Overview exactly as it always has.
*/
const FundSnapshot = ({ fund, roundsSummary, currency, tripId }) => {
  const { t } = useTranslation();
  if (!fund?.has_fund) return null;
  const shortfall = Number(fund.shortfall) > 0;

  return (
    <section className="ov-panel ov-panel--fund">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm"><i className="bi bi-piggy-bank" aria-hidden="true" /> {t('dashboard.overview.fundTitle')}</h3>
        <Link className="ov-link" to={`/trips/${tripId}/fund`}>{t('dashboard.overview.viewDetails')}</Link>
      </header>
      <div className="ov-panel__body">
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
