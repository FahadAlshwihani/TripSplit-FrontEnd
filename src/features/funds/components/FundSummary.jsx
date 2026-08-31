import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  Bento hierarchy from the Stitch reference: one large "available balance"
  tile, secondary tiles beside/below it. balance/surplus/deficit/
  collected/spent/refunded/reimbursed are ALL server-computed
  (apps.funds.services.accounting) -- nothing here is re-derived
  client-side. The budget header (target + collected/remaining, plus the
  edit action) is the ONE place this page communicates that the Trip
  Fund IS the trip's budget (see docs/architecture/fund-accounting.md)
  -- added here rather than a redesign of the existing bento below.
*/
const FundSummary = ({ accounting, targetAmount, collected, collectionRemaining, currency, canManage, onEditTarget }) => {
  const { t } = useTranslation();
  const balance = Number(accounting.balance);
  const state = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero';
  const hasTarget = Number(targetAmount) > 0;

  return (
    <div className="fund-summary">
      <div className="fund-summary__budget">
        <div className="fund-summary__budget-text">
          <span className="fund-summary__budget-label text-label">{t('fund.budgetTarget')}</span>
          {hasTarget ? (
            <Money value={targetAmount} currency={currency} className="fund-summary__budget-value" currencyClassName="fund-summary__budget-value-currency" />
          ) : (
            <span className="fund-summary__budget-unset text-copy">{t('fund.budgetNotSetYet')}</span>
          )}
          {hasTarget && (
            <p className="fund-summary__budget-collected text-copy-sm">
              {t('fund.collected')} <Money value={collected} currency={currency} variant="tabular" /> · {t('dashboard.overview.remainingToCollect')} <Money value={collectionRemaining} currency={currency} variant="tabular" />
            </p>
          )}
        </div>
        {canManage && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={onEditTarget}>
            <i className="bi bi-pencil" aria-hidden="true" /> {t('fund.editBudget')}
          </button>
        )}
      </div>
      <div className={`fund-summary__primary fund-summary__primary--${state}`}>
        <span className="fund-summary__primary-label">{t('fund.available')}</span>
        <Money value={accounting.balance} currency={currency} className="fund-summary__primary-value" currencyClassName="fund-summary__primary-value-currency" />
        <p className="fund-summary__primary-hint">
          {state === 'negative' ? t('fund.shortfallHint') : t('fund.availableHint')}
        </p>
      </div>
      <div className="fund-summary__tiles">
        <div className="fund-summary__tile">
          <span className="fund-summary__tile-label">{t('fund.collected')}</span>
          <Money value={accounting.collected} currency={currency} variant="tabular" className="fund-summary__tile-value" />
        </div>
        <div className="fund-summary__tile">
          <span className="fund-summary__tile-label">{t('fund.spent')}</span>
          <Money value={accounting.spent} currency={currency} variant="tabular" className="fund-summary__tile-value" />
        </div>
        <div className="fund-summary__tile">
          <span className="fund-summary__tile-label">{t('fund.reimbursedLabel')}</span>
          <Money value={accounting.reimbursed} currency={currency} variant="tabular" className="fund-summary__tile-value" />
        </div>
        <div className="fund-summary__tile">
          <span className="fund-summary__tile-label">{t('fund.refunded')}</span>
          <Money value={accounting.refunded} currency={currency} variant="tabular" className="fund-summary__tile-value" />
        </div>
      </div>
    </div>
  );
};

export default FundSummary;
