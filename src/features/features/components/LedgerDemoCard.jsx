import React from 'react';
import { useTranslation } from 'react-i18next';

const ROWS = [
  { key: 'paid', variant: 'credit' },
  { key: 'owes1', variant: 'debit' },
  { key: 'owes2', variant: 'debit' },
];

const LedgerDemoCard = () => {
  const { t } = useTranslation();
  return (
    <div className="ledger-demo" aria-hidden="true">
      <div className="ledger-demo__mock">
        <div className="ledger-demo__header">
          <span className="ledger-demo__title text-label">{t('features.section1.demo.title')}</span>
          <span className="ledger-demo__amount text-financial">{t('features.section1.demo.amount')}</span>
        </div>
        {ROWS.map(({ key, variant }) => (
          <div className="ledger-demo__row" key={key}>
            <span className="ledger-demo__row-name text-copy-sm">{t(`features.section1.demo.rows.${key}.name`)}</span>
            <span className={`ledger-demo__row-amount ledger-demo__row-amount--${variant} text-financial`}>{t(`features.section1.demo.rows.${key}.amount`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LedgerDemoCard;
