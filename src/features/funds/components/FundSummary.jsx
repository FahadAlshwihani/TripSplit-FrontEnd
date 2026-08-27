import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  Bento hierarchy from the Stitch reference: one large "available balance"
  tile, four small secondary tiles beside/below it. balance/surplus/
  deficit/collected/spent/refunded/reimbursed are ALL server-computed
  (apps.funds.services.accounting) -- nothing here is re-derived
  client-side.
*/
const FundSummary = ({ accounting, currency }) => {
  const { t } = useTranslation();
  const balance = Number(accounting.balance);
  const state = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero';

  return (
    <div className="fund-summary">
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
