import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import MemberActionsMenu from './MemberActionsMenu';

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

  The balance card's three states (positive/negative/zero) reuse the
  exact same visual recipe as Balances' own NetBalanceCard
  (.bal-net-card / here .mem-balance-card) -- "a member's balance" reads
  as the same kind of object wherever it appears in the app.
*/
const MemberDetail = ({ detail, currency, tripId, onBack, onRole, onRemove, onTransfer, onLeave, onBan, currentMember }) => {
  const { t, i18n } = useTranslation();
  if (!detail) {
    return (
      <div className="mem-detail mem-detail--empty">
        <p className="text-copy-sm">{t('members.selectAMember')}</p>
      </div>
    );
  }
  const { member, statistics } = detail;
  const canSettle = Boolean(member.capabilities?.can_settle_with);
  const hasFundParticipation = statistics.fund && (Number(statistics.fund.contributed) !== 0 || Number(statistics.fund.reimbursed) !== 0);
  const balanceValue = Number(statistics.current_balance);
  const balanceState = balanceValue > 0 ? 'positive' : balanceValue < 0 ? 'negative' : 'zero';
  const isCurrentMember = member.id === currentMember?.id;

  return (
    <div className="mem-detail">
      {onBack && (
        <button type="button" className="mem-detail__back" onClick={onBack}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> {t('common.back')}
        </button>
      )}
      <header className="mem-detail__header">
        <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="md" />
        <div className="mem-detail__identity">
          <h2 className="text-headline mem-detail__name">{member.display_name}</h2>
          <span className="mem-detail__badges">
            <span className={`mem-badge mem-badge--role-${member.role}`}>{t(`role.${member.role}`)}</span>
            <span className="mem-badge mem-badge--identity">{t(`identity.${member.identity_type}`)}</span>
            {!member.active && <span className="mem-badge mem-badge--inactive">{t('members.inactive')}</span>}
          </span>
          <span className="mem-detail__meta">
            <span className="mem-detail__meta-row">{t('members.joined')}: {formatDate(member.joined_at)}</span>
            {member.email && <span className="mem-detail__meta-row"><bdi dir="ltr" className="mem-detail__email">{member.email}</bdi></span>}
          </span>
        </div>
        {onRole && (
          <MemberActionsMenu
            member={{ ...member, isCurrentMember }}
            label={`${t('members.details')} ${member.display_name}`}
            onPromote={(m) => onRole(m, 'admin')}
            onDemote={(m) => onRole(m, 'member')}
            onTransfer={onTransfer}
            onRemove={onRemove}
            onBan={onBan}
            onLeave={onLeave}
          />
        )}
      </header>

      <div className={`mem-balance-card mem-balance-card--${balanceState}`}>
        <span className="mem-balance-card__label">{t('members.currentBalance')}</span>
        <Money value={statistics.current_balance} currency={currency} variant="display" className="mem-balance-card__value" currencyClassName="mem-balance-card__value-currency" />
        <p className="mem-balance-card__hint">
          <i className={`bi ${balanceState === 'positive' ? 'bi-graph-up-arrow' : balanceState === 'negative' ? 'bi-graph-down-arrow' : 'bi-check-circle'}`} aria-hidden="true" />
          {t(`members.balanceHint.${balanceState}`)}
        </p>
      </div>

      {canSettle && (
        <Link to={`/trips/${tripId}/balances`} className="dash-btn dash-btn--primary">
          {t('members.settleUp', { name: member.display_name })}
        </Link>
      )}
      {!canSettle && balanceValue !== 0 && (
        <Link to={`/trips/${tripId}/balances`} className="dash-btn dash-btn--secondary">{t('members.viewBalances')}</Link>
      )}

      <dl className="mem-bento">
        <div><dt>{t('balances.paid')}</dt><dd><Money value={statistics.total_paid} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('balances.share')}</dt><dd><Money value={statistics.total_expense_share} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('members.personalSpending')}</dt><dd><Money value={statistics.total_personal_spending} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('balances.sent')}</dt><dd><Money value={statistics.settlements_sent} currency={currency} variant="tabular" /></dd></div>
        <div><dt>{t('members.expenseCount')}</dt><dd>{statistics.expense_count}</dd></div>
        <div><dt>{t('members.lastActivity')}</dt><dd>{statistics.last_activity_at ? formatDateTime(statistics.last_activity_at, i18n.language) : '—'}</dd></div>
      </dl>

      {hasFundParticipation && (
        <section className="mem-fund">
          <h3 className="text-label">{t('members.fundParticipation')}</h3>
          <dl className="mem-bento mem-fund__bento">
            <div><dt>{t('members.fundContributed')}</dt><dd><Money value={statistics.fund.contributed} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('members.fundReimbursed')}</dt><dd><Money value={statistics.fund.reimbursed} currency={currency} variant="tabular" /></dd></div>
          </dl>
        </section>
      )}
    </div>
  );
};

export default MemberDetail;
