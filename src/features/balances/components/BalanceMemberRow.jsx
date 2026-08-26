import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import PendingSettlementCard from '../../settlements/components/PendingSettlementCard';

/*
  One row in either "People who owe me" or "People I owe". Three
  possible states per row:

  1. A pending settlement already exists for this pair -- render the
     compact PendingSettlementCard instead of a normal action (never a
     plain "Send Reminder"/"I Paid" button pretending nothing happened).
  2. direction="owes_me", no pending report -- Send Reminder (own
     loading/cooldown/sent state) + Record Payment Received.
  3. direction="i_owe", no pending report -- "I Paid".
*/
const BalanceMemberRow = ({
  member, amount, currency, direction,
  pendingSettlement, pendingActionState, onConfirmPending, onNotReceivedPending, onCheckLaterPending, onCancelPending,
  reminderState, onRemind, canRemind,
  onIPaid, onRecordReceived,
  readOnly,
}) => {
  const { t } = useTranslation();
  const sending = reminderState?.status === 'sending';

  return (
    <div className="bal-row">
      <div className="bal-row__who">
        <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
        <div className="bal-row__identity">
          <span className="bal-row__name">{member.display_name}</span>
          <span className="bal-row__relationship">{t(direction === 'owes_me' ? 'balances.owesYou' : 'balances.youOwe')}</span>
        </div>
      </div>
      <div className="bal-row__end">
        <Money value={amount} currency={currency} variant="tabular" className="bal-row__amount" />
        {!pendingSettlement && (direction === 'owes_me' ? (
          <div className="bal-row__action">
            <div className="bal-row__action-buttons">
              <button
                type="button"
                className={`bal-remind-btn${sending ? ' is-loading' : ''}`}
                onClick={() => onRemind(member.member_id)}
                disabled={readOnly || sending || !canRemind}
                aria-label={t('balances.sendReminder')}
                title={t('balances.sendReminder')}
              >
                {sending ? <span className="bal-remind-btn__spinner" aria-hidden="true" /> : <i className="bi bi-bell" aria-hidden="true" />}
                <span className="bal-remind-btn__label">{t('balances.sendReminder')}</span>
              </button>
              {!readOnly && onRecordReceived && (
                <button type="button" className="dash-btn dash-btn--secondary bal-row__settle-btn" onClick={() => onRecordReceived(member)}>
                  {t('settlements.recordReceived')}
                </button>
              )}
            </div>
            <p className="bal-row__feedback" role="status" aria-live="polite">
              {reminderState?.status === 'sent' && t('balances.reminderSent', { name: member.display_name })}
              {reminderState?.status === 'cooldown' && t('balances.reminderCooldown')}
              {reminderState?.status === 'error' && (reminderState.message || t('error.action'))}
              {!reminderState && !canRemind && t('balances.reminderCooldown')}
            </p>
          </div>
        ) : (
          !readOnly && onIPaid && (
            <button type="button" className="dash-btn dash-btn--primary bal-row__settle-btn" onClick={() => onIPaid(member)}>
              {t('settlements.iPaid')}
            </button>
          )
        ))}
      </div>

      {pendingSettlement && (
        <PendingSettlementCard
          settlement={pendingSettlement}
          direction={direction === 'owes_me' ? 'creditor' : 'debtor'}
          otherName={member.display_name}
          currency={currency}
          onConfirm={onConfirmPending}
          onNotReceived={onNotReceivedPending}
          onCheckLater={onCheckLaterPending}
          onCancel={onCancelPending}
          actionState={pendingActionState}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default BalanceMemberRow;
