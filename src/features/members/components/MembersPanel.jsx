import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';
import MemberActionsMenu from './MemberActionsMenu';

/*
  The left-hand list in the Members master/detail layout -- rebuilt to
  match the Stitch reference's clean, compact record list rather than
  an admin-table look: a subtle toolbar (search + historical filter,
  both de-emphasized, never taller/louder than the records below them),
  MEMBER/BALANCE column labels, and dense rows with no per-row border/
  shadow at rest.

  Search is a plain client-side name filter (the brief explicitly says
  not to overbuild this) -- the full member list is already fetched for
  the page, so no separate search endpoint exists or is needed.

  Every row's balance comes from GET /trips/{id}/balances/ (the same
  canonical calculate_balances() the Balances page itself renders from),
  passed in as `balancesByMemberId` -- never recomputed here.

  "+ Add" links into Governance (invitations/join requests live there,
  not on Members -- see architecture/membership.md's page-split
  rationale) rather than duplicating an invite flow on this page.
*/
const MembersPanel = ({ members, currentMember, currency, tripId, canInvite, selectedId, onSelect, balancesByMemberId, onRole, onRemove, onTransfer, onLeave, onBan, showHistorical, onToggleHistorical }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // "Members (N)" is always the ACTIVE count, even while the historical
  // toggle is on and `members` includes left/removed rows too (brief
  // 73/74 -- never count a pending invite, banned non-member, or
  // historical member in this number).
  const activeCount = members.filter((member) => member.active !== false).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => member.display_name.toLowerCase().includes(query));
  }, [members, search]);

  return (
    <section className="mem-list">
      <div className="mem-list__header">
        <h2 className="text-headline mem-list__title">{t('members.title')} <span className="mem-list__count">({activeCount})</span></h2>
        {canInvite && <Link to={`/trips/${tripId}/governance`} className="mem-list__add"><i className="bi bi-person-plus" aria-hidden="true" /> {t('members.addAction')}</Link>}
      </div>

      <div className="mem-toolbar">
        <div className="mem-search">
          <i className="bi bi-search mem-search__icon" aria-hidden="true" />
          <label className="dash-visually-hidden" htmlFor="members-search">{t('members.searchPlaceholder')}</label>
          <input
            id="members-search"
            type="search"
            className="mem-search__input"
            placeholder={t('members.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {onToggleHistorical && (
          <label className="mem-toolbar__historical">
            <span className="acc-switch">
              <input type="checkbox" checked={showHistorical} onChange={(event) => onToggleHistorical(event.target.checked)} />
              <span className="acc-switch__track" aria-hidden="true" />
            </span>
            {t('members.showHistorical')}
          </label>
        )}
      </div>

      <div className="mem-list__columns">
        <span>{t('members.columnMember')}</span>
        <span>{t('members.columnBalance')}</span>
      </div>

      <ul className="mem-list__rows">
        {filtered.map((member) => {
          const balance = balancesByMemberId?.[member.id];
          const balanceSign = balance !== undefined ? (Number(balance) > 0 ? 'positive' : Number(balance) < 0 ? 'negative' : 'zero') : null;
          const isSelected = member.id === selectedId;
          const isCurrentMember = member.id === currentMember?.id;
          return (
            <li key={member.id}>
              <button
                type="button"
                className={`mem-row${isSelected ? ' mem-row--selected' : ''}`}
                onClick={() => onSelect(member)}
                aria-current={isSelected}
              >
                <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
                <span className="mem-row__main">
                  <span className="mem-row__name">{member.display_name}</span>
                  <span className="mem-row__meta">
                    <span className={`mem-badge mem-badge--role-${member.role}`}>{t(`role.${member.role}`)}</span>
                    <span className="mem-row__joined">{t('members.joinedShort', { date: formatDate(member.joined_at) })} · {t(`identity.${member.identity_type}`)}</span>
                    {member.active === false && <span className="mem-badge mem-badge--inactive">{t('members.inactive')}</span>}
                  </span>
                </span>
                {balance !== undefined && <Money value={balance} currency={currency} variant="tabular" className={`mem-row__balance mem-row__balance--${balanceSign}`} />}
              </button>
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
            </li>
          );
        })}
        {!filtered.length && <li className="mem-list__empty text-copy-sm">{t('members.noSearchResults')}</li>}
      </ul>
    </section>
  );
};
export default MembersPanel;
