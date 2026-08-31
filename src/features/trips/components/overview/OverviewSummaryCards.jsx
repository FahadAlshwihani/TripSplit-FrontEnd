import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';

// The four-card fast-scan bento: trip budget (TripFund.target_amount,
// via summary.budget -- see docs/architecture/fund-accounting.md, "The
// Trip Fund is the budget"), total spent, available Fund cash
// (fund.available, the canonical accounting() balance), and the
// viewer's own balance. No card here recomputes a figure the backend
// already reports -- every value is read straight off the payload.
const OverviewSummaryCards = ({ summary, fund, currency }) => {
  const { t } = useTranslation();
  const balancePositive = summary.my_balance !== null && Number(summary.my_balance) >= 0;
  const hasAvailable = Boolean(fund?.has_fund);

  return (
    <div className="ov-cards">
      <article className="ov-card ov-card--budget">
        <div className="ov-card__head">
          <span className="ov-card__label">{t('dashboard.overview.totalBudget')}</span>
          <i className="bi bi-bank ov-card__icon" aria-hidden="true" />
        </div>
        {summary.budget_set ? (
          <Money value={summary.budget} currency={currency} className="ov-card__value" currencyClassName="ov-card__value-currency" />
        ) : (
          <span className="ov-card__muted">{t('dashboard.overview.noBudgetSet')}</span>
        )}
      </article>

      <article className="ov-card ov-card--spent">
        <div className="ov-card__head">
          <span className="ov-card__label">{t('dashboard.overview.totalSpent')}</span>
          <i className="bi bi-graph-up-arrow ov-card__icon" aria-hidden="true" />
        </div>
        <Money value={summary.total_spent} currency={currency} className="ov-card__value" currencyClassName="ov-card__value-currency" />
      </article>

      <article className="ov-card ov-card--available">
        <span className="ov-card__label ov-card__label--plain">{t('dashboard.overview.fundAvailable')}</span>
        {hasAvailable ? (
          <Money value={fund.available} currency={currency} className="ov-card__value-sm" currencyClassName="ov-card__value-sm-currency" />
        ) : (
          <span className="ov-card__muted">{t('dashboard.overview.noBudgetSet')}</span>
        )}
      </article>

      <article className={`ov-card ov-card--balance${balancePositive ? ' is-positive' : ' is-negative'}`}>
        <span className="ov-card__label">{t('dashboard.overview.myBalance')}</span>
        <Money value={summary.my_balance} currency={currency} className="ov-card__value-sm" currencyClassName="ov-card__value-sm-currency" />
      </article>
    </div>
  );
};

export default OverviewSummaryCards;
