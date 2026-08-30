import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate, formatDateTime } from '../../../shared/utils/format';

/*
  Settle Up is gated on capabilities.can_settle_with -- a real simplify_
  debts() pairwise edge between the viewer and this member, computed
  server-side (see member_capabilities()/member_settlement_pair()). This
  member's own group-net balance is NOT sufficient: two members can each
  carry a large balance while owing each other nothing directly, so
  showing "Settle up" from balance alone would offer a settlement that
  doesn't correspond to any real debt between these two people.
*/
const MemberDetail = ({ detail, currency, tripId, onClose }) => {
  const { t, i18n } = useTranslation();
  if (!detail) return null;
  const { member, statistics } = detail;
  const canSettle = Boolean(member.capabilities?.can_settle_with);
  return (
    <div className="member-detail" role="dialog" aria-modal="true" aria-label={t('members.details')}>
      <div className="card-pc member-detail__card">
        <button className="dialog-close" onClick={onClose} aria-label={t('common.close')}>×</button>
        <h2><Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" /> {member.display_name}</h2>
        <p>{t(`role.${member.role}`)} · {t(`identity.${member.identity_type}`)} · {member.active ? t('members.active') : t('members.inactive')}</p>
        <p>{t('members.joined')}: {formatDate(member.joined_at)}</p>
        <p>{t('members.lastActivity')}: {statistics.last_activity_at ? formatDateTime(statistics.last_activity_at, i18n.language) : '—'}</p>

        <div className="member-detail__balance">
          <span className="member-detail__balance-label">{t('members.currentBalance')}</span>
          <Money value={statistics.current_balance} currency={currency} variant="display" />
        </div>

        {canSettle && (
          <Link to={`/trips/${tripId}/balances`} className="dash-btn dash-btn--primary">
            {t('members.settleUp', { name: member.display_name })}
          </Link>
        )}
        {!canSettle && Number(statistics.current_balance) !== 0 && (
          <Link to={`/trips/${tripId}/balances`} className="dash-btn dash-btn--secondary">{t('members.viewBalances')}</Link>
        )}

        <dl className="statistics-grid">
          <div><dt>{t('balances.paid')}</dt><dd><Money value={statistics.total_paid} currency={currency} variant="tabular" /></dd></div>
          <div><dt>{t('balances.share')}</dt><dd><Money value={statistics.total_expense_share} currency={currency} variant="tabular" /></dd></div>
          <div><dt>{t('members.personalSpending')}</dt><dd><Money value={statistics.total_personal_spending} currency={currency} variant="tabular" /></dd></div>
          <div><dt>{t('balances.sent')}</dt><dd><Money value={statistics.settlements_sent} currency={currency} variant="tabular" /></dd></div>
          <div><dt>{t('balances.received')}</dt><dd><Money value={statistics.settlements_received} currency={currency} variant="tabular" /></dd></div>
          <div><dt>{t('members.expenseCount')}</dt><dd>{statistics.expense_count}</dd></div>
        </dl>
      </div>
    </div>
  );
};

export default MemberDetail;
