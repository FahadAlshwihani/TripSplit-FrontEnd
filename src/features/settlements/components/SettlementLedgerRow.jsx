import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

/*
  One row in the full settlement ledger (Settlements page) -- the
  permanent historical record. Compact, click-through to the full
  timeline -- this page is the history, not a second action-focused
  surface duplicating Balances. Inline review actions are offered only
  for a still-pending/rejected row the current member can actually act
  on (recipient/reporter or an admin), reusing the exact same permission
  shape as the Balances pending card.

  A confirmed row shows real payer/recipient avatars and both the
  payment date and the confirmation date -- `reviewed_at`/`reviewed_by`
  are the actual confirmation timestamp/actor once status is confirmed
  (set at the exact confirming transition, never fabricated -- see
  docs/architecture/financial-ledger.md).
*/
const STATUS_ICON = { pending: 'bi-hourglass-split', confirmed: 'bi-check-circle', rejected: 'bi-x-circle', cancelled: 'bi-slash-circle' };
const formatTime = (value) => (value ? new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null);

const SettlementLedgerRow = ({ settlement, currency, fromMember, toMember, canReview, canCancel, canRetry, onOpen, onConfirm, onNotReceived, onCheckLater, onCancel, onRetry, busy }) => {
  const { t } = useTranslation();
  const confirmed = settlement.status === 'confirmed';
  // The row's own text content mixes avatar-initials glyphs, names,
  // dates, and buttons in a visual order screen readers shouldn't have
  // to untangle -- a single explicit label states the one fact this
  // whole row represents.
  const rowLabel = `${settlement.from_name} → ${settlement.to_name}, ${settlement.amount} ${currency}, ${t(`settlements.status.${settlement.status}`)}`;
  return (
    <div className="settle-row" role="button" tabIndex={0} aria-label={rowLabel} onClick={() => onOpen(settlement)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(settlement); } }}>
      <div className="settle-row__who">
        <div className="settle-row__parties">
          <span className="settle-row__party">
            {fromMember && <Avatar avatarKey={avatarKeyFromAvatar(fromMember.avatar)} displayName={settlement.from_name} size="sm" />}
            {settlement.from_name}
          </span>
          <i className="bi bi-arrow-right settle-row__arrow" aria-hidden="true" />
          <span className="settle-row__party">
            {toMember && <Avatar avatarKey={avatarKeyFromAvatar(toMember.avatar)} displayName={settlement.to_name} size="sm" />}
            {settlement.to_name}
          </span>
        </div>
        <div className="settle-row__meta">
          <span className={`settle-status-badge settle-status-badge--${settlement.status}`}><i className={`bi ${STATUS_ICON[settlement.status]}`} aria-hidden="true" />{t(`settlements.status.${settlement.status}`)}</span>
          <span className="settle-row__date">{t('settlements.paymentDateLabel')}: {formatDate(settlement.settlement_date)}</span>
          {confirmed && settlement.reviewed_at && (
            <span className="settle-row__date settle-row__date--confirmed">{t('settlements.confirmedAtLabel')}: {formatDate(settlement.reviewed_at)} • {formatTime(settlement.reviewed_at)}</span>
          )}
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
        {settlement.status === 'rejected' && canRetry && (
          <div className="settle-pending-card__buttons">
            <button type="button" className="bal-remind-btn" disabled={busy || settlement.retry_cooldown_active} aria-label={t('settlements.retryAction')} title={settlement.retry_cooldown_active ? t('settlements.retryCooldown') : t('settlements.retryAction')} onClick={() => onRetry(settlement)}><i className="bi bi-arrow-repeat" aria-hidden="true" /></button>
          </div>
        )}
        <span className="settle-row__view-link">{t('settlements.viewDetailsAction')}</span>
      </div>
    </div>
  );
};

export default SettlementLedgerRow;
