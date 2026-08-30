import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate, formatDateTime } from '../../../shared/utils/format';

/*
  The right-hand panel in the Members master/detail layout (Stitch's
  "Financial Record" reference) -- an inline panel, not a modal, so it
  carries no dialog/overlay chrome of its own; MembersPage decides
  whether it renders beside the list (desktop) or replaces it
  full-width (mobile, via onBack).

  Settle Up is gated on capabilities.can_settle_with -- a real simplify_
  debts() pairwise edge between the viewer and this member, computed
  server-side (see member_capabilities()/member_settlement_pair()). This
  member's own group-net balance is NOT sufficient: two members can each
  carry a large balance while owing each other nothing directly, so
  showing "Settle up" from balance alone would offer a settlement that
  doesn't correspond to any real debt between these two people.

  Fund Participation (confirmed contributions / reimbursements) is a
  visually SEPARATE block from current_balance -- the two ledgers never
  mix, even though both come from the same member_detail_view response.
*/
const MemberDetail = ({ detail, currency, tripId, onBack }) => {
  const { t, i18n } = useTranslation();
  if (!detail) {
    return (
      <div className="member-detail-panel member-detail-panel--empty">
        <p className="text-copy-sm">{t('members.selectAMember')}</p>
      </div>
    );
  }
  const { member, statistics } = detail;
  const canSettle = Boolean(member.capabilities?.can_settle_with);
  const hasFundParticipation = statistics.fund && (Number(statistics.fund.contributed) !== 0 || Number(statistics.fund.reimbursed) !== 0);

  return (
    <div className="member-detail-panel">
      {onBack && (
        <button type="button" className="member-detail-panel__back" onClick={onBack}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> {t('common.back')}
        </button>
      )}
      <header className="member-detail-panel__header">
        <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="md" />
        <div>
          <h2 className="text-headline-sm">{member.display_name}</h2>
          <p className="text-copy-sm member-detail-panel__meta">
            {t(`role.${member.role}`)} · {t(`identity.${member.identity_type}`)}
            {!member.active && <> · {t('members.inactive')}</>}
          </p>
          <p className="text-copy-sm member-detail-panel__meta">{t('members.joined')}: {formatDate(member.joined_at)}</p>
          {member.email && <p className="text-copy-sm member-detail-panel__meta"><bdi dir="ltr">{member.email}</bdi></p>}
        </div>
      </header>

      <div className="member-detail-panel__balance">
        <span className="member-detail-panel__balance-label">{t('members.currentBalance')}</span>
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

      <dl className="member-detail-panel__bento">
        <div><dt>{t('balances.paid')}</dt><dd><Money value={statistics.total_paid} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('balances.share')}</dt><dd><Money value={statistics.total_expense_share} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('members.personalSpending')}</dt><dd><Money value={statistics.total_personal_spending} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('balances.sent')}</dt><dd><Money value={statistics.settlements_sent} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('members.expenseCount')}</dt><dd>{statistics.expense_count}</dd></div>
        <div><dt>{t('members.lastActivity')}</dt><dd>{statistics.last_activity_at ? formatDateTime(statistics.last_activity_at, i18n.language) : '—'}</dd></div>
      </dl>

      {hasFundParticipation && (
        <section className="member-detail-panel__fund">
          <h3 className="text-label">{t('members.fundParticipation')}</h3>
          <dl className="member-detail-panel__bento member-detail-panel__bento--fund">
            <div><dt>{t('members.fundContributed')}</dt><dd><Money value={statistics.fund.contributed} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('members.fundReimbursed')}</dt><dd><Money value={statistics.fund.reimbursed} currency={currency} variant="tabular" /></dd></div>
          </dl>
        </section>
      )}
    </div>
  );
};

export default MemberDetail;
