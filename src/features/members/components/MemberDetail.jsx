import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import MemberActionsMenu from './MemberActionsMenu';

/*
  The right-hand stack in the Members master/detail layout -- rebuilt
  to match Stitch's own two-card composition (a compact profile card,
  then a Financial Record card) rather than one oversized, loosely
  spaced card. Mobile renders the same two cards full-width, with a
  canonical Back button on top instead of a desktop master/detail
  frame -- MembersPage decides whether this renders beside the list
  (desktop) or replaces it (mobile, via onBack).

  Settle Up is gated on capabilities.can_settle_with -- a real simplify_
  debts() pairwise edge between the viewer and this member, computed
  server-side (see member_capabilities()/member_settlement_pair()). This
  member's own group-net balance is NOT sufficient: two members can each
  carry a large balance while owing each other nothing directly, so
  showing "Settle up" from balance alone would offer a settlement that
  doesn't correspond to any real debt between these two people. Stitch's
  own reference always shows the button; TripSplit's position is the
  same, but the action/copy stays gated on this real obligation check.

  Fund Participation is a visually separate subsection (thin rule + own
  label) inside the SAME financial-record card, reusing the integrated-
  grid recipe -- never mixed into current_balance, never a second set
  of floating mini-cards.
*/
const MemberDetail = ({ detail, currency, onBack, onRole, onRemove, onTransfer, onLeave, onBan, currentMember }) => {
  const { t, i18n } = useTranslation();
  // In-app navigation link -- uses the trip's own short_code (the
  // canonical browser-URL form), never the outlet context's own
  // `tripId` (deliberately the UUID everywhere, for API calls only --
  // see TripLayout's own comment).
  const { trip } = useOutletContext();

  const back = onBack && (
    <button type="button" className="dash-btn dash-btn--secondary mem-back" onClick={onBack}>
      <i className="bi bi-arrow-left mem-back__icon" aria-hidden="true" /> <span className="dash-btn__label">{t('common.back')}</span>
    </button>
  );

  if (!detail) {
    return (
      <div className="mem-detail-stack">
        {back}
        <div className="mem-profile-card mem-profile-card--empty">
          <p className="text-copy-sm">{t('members.selectAMember')}</p>
        </div>
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
    <div className="mem-detail-stack">
      {back}

      <header className="mem-profile-card">
        <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="md" />
        <div className="mem-profile-card__identity">
          <h2 className="text-headline mem-profile-card__name">{member.display_name}</h2>
          {member.email
            ? <bdi dir="ltr" className="mem-profile-card__email">{member.email}</bdi>
            : <span className="mem-profile-card__email">{t(`identity.${member.identity_type}`)}</span>}
          <span className="mem-profile-card__badges">
            <span className={`mem-badge mem-badge--role-${member.role}`}>{t(`role.${member.role}`)}</span>
            {!member.active && <span className="mem-badge mem-badge--inactive">{t('members.inactive')}</span>}
          </span>
          <span className="mem-profile-card__joined">{t('members.joined')}: {formatDate(member.joined_at)}</span>
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

      <section className="mem-financial-card">
        <div className="mem-financial-card__header">
          <h3 className="text-title mem-financial-card__title"><i className="bi bi-bank" aria-hidden="true" /> {t('members.financialRecord')}</h3>
          <span className="mem-financial-card__current-label">{t('members.currentBalance')}</span>
        </div>

        <div className="mem-financial-card__body">
          <div className={`mem-balance-panel mem-balance-panel--${balanceState}`}>
            <Money value={statistics.current_balance} currency={currency} variant="display" className="mem-balance-panel__value" currencyClassName="mem-balance-panel__value-currency" />
            <p className="mem-balance-panel__hint">
              <i className={`bi ${balanceState === 'positive' ? 'bi-graph-up-arrow' : balanceState === 'negative' ? 'bi-graph-down-arrow' : 'bi-check-circle'}`} aria-hidden="true" />
              {t(`members.balanceHint.${balanceState}`)}
            </p>
            {canSettle && (
              <Link to={`/trips/${trip.short_code}/balances`} className="dash-btn dash-btn--secondary">{t('members.settleUp', { name: member.display_name })}</Link>
            )}
            {!canSettle && balanceValue !== 0 && (
              <Link to={`/trips/${trip.short_code}/balances`} className="dash-btn dash-btn--secondary">{t('members.viewBalances')}</Link>
            )}
          </div>

          <dl className="mem-financial-grid">
            <div><dt>{t('balances.paid')}</dt><dd><Money value={statistics.total_paid} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('balances.share')}</dt><dd><Money value={statistics.total_expense_share} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('members.personalSpending')}</dt><dd><Money value={statistics.total_personal_spending} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('balances.sent')}</dt><dd><Money value={statistics.settlements_sent} currency={currency} variant="tabular" /></dd></div>
            <div><dt>{t('members.expenseCount')}</dt><dd>{statistics.expense_count}</dd></div>
            <div><dt>{t('members.lastActivity')}</dt><dd>{statistics.last_activity_at ? formatDateTime(statistics.last_activity_at, i18n.language) : '—'}</dd></div>
          </dl>

          {hasFundParticipation && (
            <section className="mem-fund">
              <h4 className="text-label">{t('members.fundParticipation')}</h4>
              <dl className="mem-financial-grid mem-fund__grid">
                <div><dt>{t('members.fundContributed')}</dt><dd><Money value={statistics.fund.contributed} currency={currency} variant="tabular" /></dd></div>
                <div><dt>{t('members.fundReimbursed')}</dt><dd><Money value={statistics.fund.reimbursed} currency={currency} variant="tabular" /></dd></div>
              </dl>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};

export default MemberDetail;
