import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';

/*
  One row in either "People who owe me" or "People I owe". The action
  differs by direction -- a debtor row gets a reminder button (own
  loading/cooldown/sent states), a creditor row gets a Settle button --
  never both, and never an ambiguous bell icon with no label.
*/
const BalanceMemberRow = ({ member, amount, currency, direction, reminderState, onRemind, canRemind, canRecordSettlement, onSettle, readOnly }) => {
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
        {direction === 'owes_me' ? (
          <div className="bal-row__action">
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
            <p className="bal-row__feedback" role="status" aria-live="polite">
              {reminderState?.status === 'sent' && t('balances.reminderSent', { name: member.display_name })}
              {reminderState?.status === 'cooldown' && t('balances.reminderCooldown')}
              {reminderState?.status === 'error' && (reminderState.message || t('error.action'))}
              {!reminderState && !canRemind && t('balances.reminderCooldown')}
            </p>
          </div>
        ) : (
          canRecordSettlement && !readOnly && (
            <button type="button" className="dash-btn dash-btn--secondary bal-row__settle-btn" onClick={() => onSettle(member)}>
              {t('settlements.record')}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default BalanceMemberRow;
