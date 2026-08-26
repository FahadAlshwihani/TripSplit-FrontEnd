import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  Compact, always-visible pending-settlement state for one row -- never a
  giant empty card, never a plain "Send Reminder" button pretending
  nothing happened once a report exists. Two shapes:

    direction="creditor" -- someone reported paying the current member;
      offers the three-way decision (received / check later / not
      received) right here, matching the brief's compact-card spec
      rather than a further modal on top of a modal.
    direction="debtor" -- the current member's own still-pending report;
      offers only Withdraw.
*/
const PendingSettlementCard = ({ settlement, direction, otherName, currency, onConfirm, onNotReceived, onCheckLater, onCancel, actionState, readOnly }) => {
  const { t } = useTranslation();
  const busy = actionState?.status === 'sending';
  const busyAction = actionState?.action;

  return (
    <div className="settle-pending-card" role="status">
      <div className="settle-pending-card__head">
        <span className="settle-pending-card__badge">{t('settlements.waitingConfirmation')}</span>
        <Money value={settlement.amount} currency={currency} variant="tabular" className="settle-pending-card__amount" />
      </div>
      <p className="settle-pending-card__body">
        {direction === 'creditor'
          ? t('settlements.reportedPayment', { name: otherName })
          : t('settlements.waitingOnThem', { name: otherName })}
        {' '}
        <span className="settle-pending-card__date">{settlement.settlement_date}</span>
      </p>
      {settlement.note && <p className="settle-pending-card__note">"{settlement.note}"</p>}

      {!readOnly && (
        <div className="settle-pending-card__actions">
          {direction === 'creditor' ? (
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
          ) : (
            <div className="settle-pending-card__buttons">
              <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={onCancel}>
                {busy && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('settlements.withdrawReport')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingSettlementCard;
