import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../../../shared/utils/format';

const OverviewSummaryCards = ({ summary, currency }) => {
  const { t } = useTranslation();
  const balancePositive = summary.my_balance !== null && Number(summary.my_balance) >= 0;

  return (
    <div className="ov-cards">
      <article className="ov-card ov-card--budget">
        <div className="ov-card__head">
          <span className="ov-card__label">{t('dashboard.overview.totalBudget')}</span>
          <i className="bi bi-bank ov-card__icon" aria-hidden="true" />
        </div>
        <p className="ov-card__value text-display">
          {summary.budget_set ? formatMoney(summary.budget, currency) : <span className="ov-card__muted">{t('dashboard.overview.noBudgetSet')}</span>}
        </p>
      </article>

      <article className="ov-card ov-card--spent">
        <div className="ov-card__head">
          <span className="ov-card__label">{t('dashboard.overview.totalSpent')}</span>
          <i className="bi bi-graph-up-arrow ov-card__icon" aria-hidden="true" />
        </div>
        <p className="ov-card__value text-display">{formatMoney(summary.total_spent, currency)}</p>
      </article>

      <article className="ov-card ov-card--remaining">
        <span className="ov-card__label">{t('dashboard.overview.remaining')}</span>
        <span className="ov-card__value-sm">
          {summary.budget_set ? formatMoney(summary.remaining, currency) : <span className="ov-card__muted">{t('dashboard.overview.noBudgetSet')}</span>}
        </span>
      </article>

      <article className={`ov-card ov-card--balance${balancePositive ? ' is-positive' : ' is-negative'}`}>
        <span className="ov-card__label">{t('dashboard.overview.myBalance')}</span>
        <span className="ov-card__value-sm">{formatMoney(summary.my_balance, currency)}</span>
      </article>
    </div>
  );
};

export default OverviewSummaryCards;
