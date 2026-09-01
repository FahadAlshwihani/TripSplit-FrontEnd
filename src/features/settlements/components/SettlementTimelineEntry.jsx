import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

const STATUS_ICON = { pending: 'schedule', confirmed: 'check_circle', rejected: 'cancel', cancelled: 'close' };

/*
  One entry in the Settlement Ledger's vertical timeline -- Stitch's
  own compact card: date + status badge, "<payer> paid <recipient>",
  amount. Presentation only -- clicking it opens the existing canonical
  SettlementTimelineDrawer (owned by the parent page), never a new
  details implementation. Real button semantics since it's genuinely
  clickable; a real <button>, not a div with a synthetic click handler.
*/
export default function SettlementTimelineEntry({ settlement, currency, onOpen }) {
  const { t } = useTranslation();
  const rowLabel = `${settlement.from_name} ${t('settlements.paidVerb')} ${settlement.to_name}, ${settlement.amount} ${currency}, ${t(`settlements.status.${settlement.status}`)}`;

  return (
    <li className="settle-timeline-entry">
      <span className={`settle-timeline-entry__node settle-timeline-entry__node--${settlement.status}`} aria-hidden="true">
        <span className="material-symbols-outlined" aria-hidden="true">{STATUS_ICON[settlement.status]}</span>
      </span>
      <button type="button" className="settle-timeline-entry__card" onClick={() => onOpen(settlement)} aria-label={rowLabel}>
        <div className="settle-timeline-entry__head">
          <span className="settle-timeline-entry__date">{formatDate(settlement.settlement_date)}</span>
          <span className={`settle-timeline-badge settle-timeline-badge--${settlement.status}`}>{t(`settlements.status.${settlement.status}`)}</span>
        </div>
        <p className="settle-timeline-entry__parties">
          <strong>{settlement.from_name}</strong> {t('settlements.paidVerb')} <strong>{settlement.to_name}</strong>
        </p>
        <Money value={settlement.amount} currency={currency} variant="tabular" className="settle-timeline-entry__amount" />
      </button>
    </li>
  );
}
