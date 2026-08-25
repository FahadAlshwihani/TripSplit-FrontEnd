import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

// Always trip-wide (see the backend's own docstring on
// expenses_summary_view) -- these four figures never change when the
// ledger below is filtered/searched, by design.
const ExpenseSummaryCards = ({ summary, currency }) => {
  const { t } = useTranslation();
  return (
    <div className="exp-cards">
      <article className="exp-card">
        <span className="exp-card__label">{t('expenses.ledger.totalSpent')}</span>
        <Money value={summary.total_spent} currency={currency} className="exp-card__value" currencyClassName="exp-card__value-currency" />
      </article>
      <article className="exp-card">
        <span className="exp-card__label">{t('expenses.ledger.fromTripFund')}</span>
        <Money value={summary.from_trip_fund} currency={currency} className="exp-card__value" currencyClassName="exp-card__value-currency" />
      </article>
      <article className="exp-card">
        <span className="exp-card__label">{t('expenses.ledger.paidPersonally')}</span>
        <Money value={summary.paid_personally} currency={currency} className="exp-card__value" currencyClassName="exp-card__value-currency" />
      </article>
      <article className="exp-card exp-card--highlight">
        <span className="exp-card__label">{t('expenses.ledger.myOutOfPocket')}</span>
        <Money value={summary.my_out_of_pocket} currency={currency} className="exp-card__value" currencyClassName="exp-card__value-currency" />
      </article>
    </div>
  );
};

export default ExpenseSummaryCards;
