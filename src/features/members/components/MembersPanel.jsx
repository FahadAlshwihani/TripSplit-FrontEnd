import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import MemberActionsMenu from './MemberActionsMenu';

/*
  The left-hand list in the Members master/detail layout. Search is a
  plain client-side name filter (the brief explicitly says not to
  overbuild this) -- the full member list is already fetched for the
  page, so no separate search endpoint exists or is needed.

  Every row's balance comes from GET /trips/{id}/balances/ (the same
  canonical calculate_balances() the Balances page itself renders from),
  passed in as `balancesByMemberId` -- never recomputed here.
*/
const MembersPanel = ({ members, currentMember, currency, selectedId, onSelect, balancesByMemberId, onRole, onRemove, onTransfer, onLeave, onBan, showHistorical, onToggleHistorical }) => {
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
    <section className="members-list card-pc">
      <div className="members-list__head">
        <h2>{t('members.title')} ({activeCount})</h2>
        {onToggleHistorical && (
          <label className="members-list__historical-toggle text-copy-sm">
            <input type="checkbox" checked={showHistorical} onChange={(event) => onToggleHistorical(event.target.checked)} />
            {t('members.showHistorical')}
          </label>
        )}
      </div>
      <label className="dash-visually-hidden" htmlFor="members-search">{t('members.searchPlaceholder')}</label>
      <input
        id="members-search"
        type="search"
        className="members-list__search"
        placeholder={t('members.searchPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ul className="members-list__rows">
        {filtered.map((member) => {
          const balance = balancesByMemberId?.[member.id];
          const isSelected = member.id === selectedId;
          const isCurrentMember = member.id === currentMember?.id;
          return (
            <li key={member.id}>
              <button
                type="button"
                className={`members-list__row${isSelected ? ' members-list__row--selected' : ''}`}
                onClick={() => onSelect(member)}
                aria-current={isSelected}
              >
                <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
                <span className="members-list__row-main">
                  <span className="members-list__row-name">{member.display_name}</span>
                  <span className="members-list__row-meta text-copy-sm">
                    <span className={`members-list__badge members-list__badge--${member.role}`}>{t(`role.${member.role}`)}</span>
                    <span className="members-list__badge members-list__badge--identity">{t(`identity.${member.identity_type}`)}</span>
                    {member.active === false && <span className="members-list__badge members-list__badge--inactive">{t('members.inactive')}</span>}
                  </span>
                </span>
                {balance !== undefined && <Money value={balance} currency={currency} variant="tabular" className="members-list__row-balance" />}
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
        {!filtered.length && <li className="members-list__empty text-copy-sm">{t('members.noSearchResults')}</li>}
      </ul>
    </section>
  );
};
export default MembersPanel;
