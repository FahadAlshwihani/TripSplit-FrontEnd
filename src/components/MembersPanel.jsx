import React from 'react';
import { useTranslation } from 'react-i18next';
import { avatarGlyph } from '../utils/avatars';

const MembersPanel = ({ members, currentMember, permissions, onRole, onRemove, onTransfer, onLeave }) => {
  const { t } = useTranslation();
  return <section className="card-pc"><h2>{t('members.title')}</h2>{members.map((member) => <div className="management-row" key={member.id}><span className="member-avatar">{avatarGlyph(member.avatar_key)}</span><div><strong>{member.display_name}</strong><small>{t(`role.${member.role}`)} · {t(`identity.${member.identity_type}`)}</small></div>{permissions.canManageMembers && member.role !== 'owner' && <div className="row-actions">{currentMember.role === 'owner' && <button onClick={() => onRole(member, member.role === 'admin' ? 'member' : 'admin')}>{t(member.role === 'admin' ? 'members.demote' : 'members.promote')}</button>}<button onClick={() => onRemove(member)}>{t('members.remove')}</button>{permissions.canTransferOwnership && <button onClick={() => onTransfer(member)}>{t('members.transfer')}</button>}</div>}</div>)}{currentMember?.role !== 'owner' && <button className="pc-btn-danger" onClick={onLeave}>{t('members.leave')}</button>}</section>;
};
export default MembersPanel;
