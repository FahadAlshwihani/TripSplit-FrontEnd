import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  Compact, always-visible settlement-attempt state for one row -- never a
  giant empty card, never a plain "Send Reminder"/"I Paid" button
  pretending nothing happened once a report exists. Covers both live
  states a pair can be in:

    status="pending"
      direction="creditor" -- someone reported paying the current member;
        offers the three-way decision (received / check later / not
        received) right here, matching the brief's compact-card spec
        rather than a further modal on top of a modal.
      direction="debtor" -- the current member's own still-pending report
        (freshly reported, or a retried one); offers only Withdraw.

    status="rejected" -- the creditor said the payment hasn't arrived.
      This must stay visibly different from "nothing happened" (the bug
      this component exists to fix): the debtor sees the rejection, and
      can ask the creditor to check again (same payment, reopens this
      exact settlement) or record a genuinely new payment (a separate
      settlement) -- these are never the same action. The creditor sees
      a short factual note that they already flagged it.
*/
const PendingSettlementCard = ({ settlement, direction, otherName, currency, onConfirm, onNotReceived, onCheckLater, onCancel, onRetry, onNewPayment, onViewHistory, actionState, readOnly }) => {
  const { t } = useTranslation();
  const busy = actionState?.status === 'sending';
  const busyAction = actionState?.action;
  const rejected = settlement.status === 'rejected';
  // A rejected report whose pairwise debt has since been paid down to
  // zero by later activity (a new confirmed settlement, an edited/
  // refunded expense, ...) is historical only -- retrying it would
  // reopen a dead settlement and re-notify the creditor about a debt
  // that no longer exists. In practice this pair would already have
  // dropped out of peopleIOwe/peopleWhoOweMe (and so out of this card
  // entirely) once resolved, but this stays a real, server-derived
  // guard rather than relying on that alone. See
  // apps.expenses.settlements.settlement_is_resolved.
  const resolved = rejected && settlement.is_resolved;

  return (
    <div className={`settle-pending-card${rejected ? ' settle-pending-card--rejected' : ''}`} role="status">
      <div className="settle-pending-card__head">
        <span className="settle-pending-card__badge">
          <i className={`bi ${rejected ? 'bi-exclamation-triangle' : 'bi-hourglass-split'}`} aria-hidden="true" />
          {rejected ? t('settlements.rejectedBadge') : t('settlements.waitingConfirmation')}
        </span>
        <Money value={settlement.amount} currency={currency} variant="tabular" className="settle-pending-card__amount" />
      </div>

      <p className="settle-pending-card__body">
        {rejected
          ? t('settlements.rejectedBody', { name: otherName, amount: settlement.amount, currency })
          : direction === 'creditor'
            ? t('settlements.reportedPayment', { name: otherName })
            : t('settlements.waitingOnThem', { name: otherName })}
        {' '}
        <span className="settle-pending-card__date">{settlement.settlement_date}</span>
      </p>
      {settlement.note && <p className="settle-pending-card__note">"{settlement.note}"</p>}
      {resolved && (
        <p className="settle-pending-card__helper">
          <span className="settle-timeline-badge settle-timeline-badge--resolved">{t('settlements.resolvedBadge')}</span>{' '}{t('settlements.resolvedNote')}
        </p>
      )}
      {rejected && !resolved && direction === 'debtor' && <p className="settle-pending-card__helper">{t('settlements.rejectedHelper')}</p>}
      {rejected && direction === 'creditor' && <p className="settle-pending-card__helper">{t('settlements.creditorRejectedNotice')}</p>}

      {!readOnly && (
        <div className="settle-pending-card__actions">
          {!rejected && direction === 'creditor' && (
            <>
              <p className="settle-pending-card__question">{t('settlements.didItArrive')}</p>
              <div className="settle-pending-card__buttons">
                <button type="button" className="dash-btn dash-btn--primary" disabled={busy} onClick={onConfirm}>
                  {busy && busyAction === 'confirm' && <span className="dash-btn__spinner" aria-hidden="true" />}
                  {t('settlements.yesReceived')}
                </button>
                <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onCheckLater}>
                  {busy && busyAction === 'check-later' && <span className="dash-btn__spinner" aria-hidden="true" />}
                  {t('settlements.checkLaterAction')}
                </button>
                <button type="button" className="dash-btn dash-btn--danger" disabled={busy} onClick={onNotReceived}>
                  {busy && busyAction === 'not-received' && <span className="dash-btn__spinner" aria-hidden="true" />}
                  {t('settlements.notReceivedAction')}
                </button>
              </div>
            </>
          )}

          {!rejected && direction === 'debtor' && (
            <div className="settle-pending-card__buttons">
              <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onCancel}>
                {busy && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('settlements.withdrawReport')}
              </button>
            </div>
          )}

          {rejected && direction === 'debtor' && (
            <div className="settle-pending-card__buttons">
              {!resolved && (
                <>
                  <button type="button" className="dash-btn dash-btn--primary" disabled={busy || settlement.retry_cooldown_active} onClick={onRetry} title={settlement.retry_cooldown_active ? t('settlements.retryCooldown') : undefined}>
                    {busy && busyAction === 'retry' && <span className="dash-btn__spinner" aria-hidden="true" />}
                    {t('settlements.retryAction')}
                  </button>
                  <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onNewPayment}>
                    {t('settlements.newPaymentAction')}
                  </button>
                </>
              )}
              <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onViewHistory}>
                {t('settlements.viewHistoryAction')}
              </button>
            </div>
          )}

          {rejected && direction === 'creditor' && (
            <div className="settle-pending-card__buttons">
              <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onViewHistory}>
                {t('settlements.viewHistoryAction')}
              </button>
            </div>
          )}
        </div>
      )}
      {rejected && settlement.retry_cooldown_active && direction === 'debtor' && (
        <p className="settle-pending-card__cooldown" role="status">{t('settlements.retryCooldown')}</p>
      )}
    </div>
  );
};

export default PendingSettlementCard;
