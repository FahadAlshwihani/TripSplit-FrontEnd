import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

/*
  Every surplus refund ever recorded -- permanent history, never a
  transient toast. See docs/architecture/fund-accounting.md for how
  proportional/equal/custom allocations are computed.
*/
const FundRefundHistory = ({ refunds, currency }) => {
  const { t } = useTranslation();
  return (
    <section className="fund-section fund-section--half">
      <h2 className="fund-section__title text-headline-md">{t('fund.refundHistory')}</h2>
      {refunds.length === 0 ? (
        <p className="text-copy-sm fund-empty-note">{t('fund.noRefunds')}</p>
      ) : (
        <div className="fund-history-list">
          {refunds.map((row) => (
            <div className="fund-history-row" key={row.id}>
              <div className="fund-history-row__main">
                <span className="fund-history-row__title text-copy"><i className="bi bi-arrow-return-left" aria-hidden="true" /> {t('fund.toMember', { name: row.display_name })}</span>
                <span className="fund-history-row__meta text-copy-sm">{t(`fund.refundMethods.${row.method}`)} · {formatDate(row.refund_date)}</span>
              </div>
              <Money value={row.amount} currency={currency} variant="tabular" className="fund-history-row__amount" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FundRefundHistory;
