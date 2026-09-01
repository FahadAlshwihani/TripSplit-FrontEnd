import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

const STATUS_ICON = { pending: 'schedule', confirmed: 'check_circle', rejected: 'cancel', cancelled: 'close' };

/*
  One entry in the Settlement Ledger -- a 40px status icon centered
  directly above this entry's own compact card (date + status badge,
  "<payer> paid <recipient>", amount); node and card are both normal-
  flow children of the same entry box, so the node always belongs to
  its own card, never a shared left/center rail. The whole entry
  alternates sides on desktop, carrying its node along with it (see
  settlements.css's own comment on .settle-timeline). Presentation
  only -- clicking it opens the existing canonical
  SettlementTimelineDrawer (owned by the parent page), never a new
  details implementation. Real button semantics since it's genuinely
  clickable; a real <button>, not a div with a synthetic click handler.

  A rejected row whose underlying debt has since been resolved by later
  activity (settlement.is_resolved, server-derived -- see
  apps.expenses.settlements.settlement_is_resolved) gets a secondary
  "resolved" badge alongside the rejected one: the rejection itself
  stays visible and true, but the row is no longer an open, actionable
  claim.
*/
export default function SettlementTimelineEntry({ settlement, currency, onOpen }) {
  const { t } = useTranslation();
  const resolved = settlement.status === 'rejected' && settlement.is_resolved;
  const rowLabel = `${settlement.from_name} ${t('settlements.paidVerb')} ${settlement.to_name}, ${settlement.amount} ${currency}, ${t(`settlements.status.${settlement.status}`)}${resolved ? `, ${t('settlements.resolvedBadge')}` : ''}`;

  return (
    <li className="settle-timeline-entry">
      <span className={`settle-timeline-entry__node settle-timeline-entry__node--${settlement.status}`} aria-hidden="true">
        <span className="material-symbols-outlined" aria-hidden="true">{STATUS_ICON[settlement.status]}</span>
      </span>
      <button type="button" className="settle-timeline-entry__card" onClick={() => onOpen(settlement)} aria-label={rowLabel}>
        <div className="settle-timeline-entry__head">
          <span className="settle-timeline-entry__date">{formatDate(settlement.settlement_date)}</span>
          <span className="settle-timeline-entry__badges">
            <span className={`settle-timeline-badge settle-timeline-badge--${settlement.status}`}>{t(`settlements.status.${settlement.status}`)}</span>
            {resolved && (
              <span className="settle-timeline-badge settle-timeline-badge--resolved">{t('settlements.resolvedBadge')}</span>
            )}
          </span>
        </div>
        <p className="settle-timeline-entry__parties">
          <strong>{settlement.from_name}</strong> {t('settlements.paidVerb')} <strong>{settlement.to_name}</strong>
        </p>
        <Money value={settlement.amount} currency={currency} variant="tabular" className="settle-timeline-entry__amount" />
      </button>
    </li>
  );
}
