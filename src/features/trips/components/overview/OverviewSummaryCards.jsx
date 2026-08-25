import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';

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

      <article className="ov-card ov-card--remaining">
        <span className="ov-card__label ov-card__label--plain">{t('dashboard.overview.remaining')}</span>
        {summary.budget_set ? (
          <Money value={summary.remaining} currency={currency} className="ov-card__value-sm" currencyClassName="ov-card__value-sm-currency" />
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
