import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';

// Budget/collected/remaining-to-collect/available all now live in
// FundSnapshot, the SOLE budget presentation on Overview (see
// docs/architecture/fund-accounting.md, "The Trip Fund is the budget")
// -- a standalone Total Budget/Remaining card here would just be the
// same numbers shown twice. This keeps only what FundSnapshot doesn't
// already cover: total trip spending and the viewer's own balance.
const OverviewSummaryCards = ({ summary, currency }) => {
  const { t } = useTranslation();
  const balancePositive = summary.my_balance !== null && Number(summary.my_balance) >= 0;

  return (
    <div className="ov-cards ov-cards--compact">
      <article className="ov-card ov-card--spent">
        <div className="ov-card__head">
          <span className="ov-card__label">{t('dashboard.overview.totalSpent')}</span>
          <i className="bi bi-graph-up-arrow ov-card__icon" aria-hidden="true" />
        </div>
        <Money value={summary.total_spent} currency={currency} className="ov-card__value" currencyClassName="ov-card__value-currency" />
      </article>

      <article className={`ov-card ov-card--balance${balancePositive ? ' is-positive' : ' is-negative'}`}>
        <span className="ov-card__label">{t('dashboard.overview.myBalance')}</span>
        <Money value={summary.my_balance} currency={currency} className="ov-card__value-sm" currencyClassName="ov-card__value-sm-currency" />
      </article>
    </div>
  );
};

export default OverviewSummaryCards;
