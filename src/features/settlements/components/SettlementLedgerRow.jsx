import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  One row in the full settlement ledger (Settlements page). Compact,
  click-through to the full timeline -- this page is the historical
  record, not a second action-focused surface duplicating Balances.
  Inline review actions are offered only for a still-pending row the
  current member can actually act on (recipient/reporter or an admin),
  reusing the exact same permission shape as the Balances pending card.
*/
const STATUS_ICON = { pending: 'bi-hourglass-split', confirmed: 'bi-check-circle', rejected: 'bi-x-circle', cancelled: 'bi-slash-circle' };

const SettlementLedgerRow = ({ settlement, currency, canReview, canCancel, onOpen, onConfirm, onNotReceived, onCheckLater, onCancel, busy }) => {
  const { t } = useTranslation();
  return (
    <div className="settle-row" role="button" tabIndex={0} onClick={() => onOpen(settlement)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(settlement); } }}>
      <div className="settle-row__who">
        <span>{settlement.from_name} → {settlement.to_name}</span>
        <div className="settle-row__meta">
          <span className={`settle-status-badge settle-status-badge--${settlement.status}`}><i className={`bi ${STATUS_ICON[settlement.status]}`} aria-hidden="true" />{t(`settlements.status.${settlement.status}`)}</span>
          <span className="settle-row__date">{settlement.settlement_date}</span>
        </div>
      </div>
      <div className="settle-row__end" onClick={(event) => event.stopPropagation()}>
        <Money value={settlement.amount} currency={currency} variant="tabular" className="settle-row__amount" />
        {settlement.status === 'pending' && (canReview || canCancel) && (
          <div className="settle-pending-card__buttons">
            {canReview && (
              <>
                <button type="button" className="bal-remind-btn" disabled={busy} aria-label={t('settlements.yesReceived')} title={t('settlements.yesReceived')} onClick={() => onConfirm(settlement)}><i className="bi bi-check-lg" aria-hidden="true" /></button>
                <button type="button" className="bal-remind-btn" disabled={busy} aria-label={t('settlements.checkLaterAction')} title={t('settlements.checkLaterAction')} onClick={() => onCheckLater(settlement)}><i className="bi bi-clock" aria-hidden="true" /></button>
                <button type="button" className="bal-remind-btn" disabled={busy} aria-label={t('settlements.notReceivedAction')} title={t('settlements.notReceivedAction')} onClick={() => onNotReceived(settlement)}><i className="bi bi-x-lg" aria-hidden="true" /></button>
              </>
            )}
            {canCancel && !canReview && (
              <button type="button" className="bal-remind-btn" disabled={busy} aria-label={t('settlements.withdrawReport')} title={t('settlements.withdrawReport')} onClick={() => onCancel(settlement)}><i className="bi bi-x-lg" aria-hidden="true" /></button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementLedgerRow;
