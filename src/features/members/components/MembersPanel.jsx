import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

/*
  Every row action renders strictly from the member's own server-computed
  `capabilities` (see apps/trips/permissions.py::member_capabilities) --
  never from a coarse role==='admin' guess. That's what keeps an Admin
  from ever seeing a "Remove" button aimed at another Admin (the backend
  denies it, but the old code only checked `role !== 'owner'`, so the
  button rendered and only failed on click).
*/
const MembersPanel = ({ members, currentMember, onRole, onRemove, onTransfer, onLeave, onDetails }) => {
  const { t } = useTranslation();
  return (
    <section className="card-pc">
      <h2>{t('members.title')} ({members.length})</h2>
      {members.map((member) => {
        const caps = member.capabilities || {};
        const hasAnyAction = caps.can_promote || caps.can_demote || caps.can_remove || caps.can_transfer_ownership;
        return (
          <div className="management-row" key={member.id}>
            <button className="member-avatar" onClick={() => onDetails(member)} aria-label={`${t('members.details')} ${member.display_name}`}>
              <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
            </button>
            <div>
              <strong>{member.display_name}</strong>
              <small>{t(`role.${member.role}`)} · {t(`identity.${member.identity_type}`)}</small>
            </div>
            {hasAnyAction && (
              <div className="row-actions">
                {caps.can_promote && <button onClick={() => onRole(member, 'admin')}>{t('members.promote')}</button>}
                {caps.can_demote && <button onClick={() => onRole(member, 'member')}>{t('members.demote')}</button>}
                {caps.can_remove && <button onClick={() => onRemove(member)}>{t('members.remove')}</button>}
                {caps.can_transfer_ownership && <button onClick={() => onTransfer(member)}>{t('members.transfer')}</button>}
              </div>
            )}
          </div>
        );
      })}
      {currentMember?.role !== 'owner' && <button className="pc-btn-danger" onClick={onLeave}>{t('members.leave')}</button>}
    </section>
  );
};
export default MembersPanel;
