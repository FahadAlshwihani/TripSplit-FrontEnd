import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { avatarGlyph } from '../utils/avatars';

const GovernancePanel = ({ requests, invitations, bans, members, onReview, onInvite, onRevokeInvite, onKick, onBan, onUnban }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [lastLink, setLastLink] = useState('');
  const invite = async (event, guest = false) => {
    event.preventDefault();
    const result = await onInvite(guest ? {} : { email });
    if (result?.token) setLastLink(`${window.location.origin}/invite/${result.token}`);
    setEmail('');
  };
  return <section className="card-pc governance-panel">
    <h2>{t('governance.title')}</h2>
    <h3>{t('governance.requests')} ({requests.length})</h3>
    {requests.map((row) => <div className="management-row" key={row.id}><span className="member-avatar">{avatarGlyph(row.avatar_key)}</span><div><strong>{row.display_name}</strong><small>{t(`identity.${row.identity_type}`)}</small></div><div className="row-actions"><button onClick={() => onReview(row, 'approve')}>{t('governance.approve')}</button><button onClick={() => onReview(row, 'reject')}>{t('governance.reject')}</button></div></div>)}
    {!requests.length && <p>{t('governance.noRequests')}</p>}
    <h3>{t('governance.invitations')}</h3>
    <form onSubmit={invite}><label>{t('governance.inviteEmail')}<input className="pc-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><div className="form-actions"><button className="pc-btn-create">{t('governance.sendInvite')}</button><button type="button" onClick={(event) => invite(event, true)}>{t('governance.guestLink')}</button></div></form>
    {lastLink && <label>{t('governance.copyOnce')}<input className="pc-input" readOnly value={lastLink} onFocus={(event) => event.target.select()} /></label>}
    {invitations.map((row) => <div className="management-row" key={row.id}><span>{row.email || t('governance.guestInvite')}<small>{new Date(row.expires_at).toLocaleDateString()}</small></span>{!row.accepted_at && !row.revoked_at && <button onClick={() => onRevokeInvite(row)}>{t('governance.revoke')}</button>}</div>)}
    <h3>{t('governance.moderation')}</h3>
    {members.filter((member) => member.role !== 'owner' && member.active !== false).map((member) => <div className="management-row" key={member.id}><span>{avatarGlyph(member.avatar_key)} {member.display_name}</span><div className="row-actions"><button onClick={() => onKick(member)}>{t('governance.kick')}</button><button onClick={() => onBan(member, '24h')}>{t('governance.ban24h')}</button><button onClick={() => onBan(member, 'permanent')}>{t('governance.banPermanent')}</button></div></div>)}
    <h3>{t('governance.bans')}</h3>
    {bans.filter((ban) => ban.active).map((ban) => <div className="management-row" key={ban.id}><span>{ban.member?.display_name || t('activity.unknown')}<small>{ban.expires_at ? new Date(ban.expires_at).toLocaleString() : t('governance.permanent')}</small></span><button onClick={() => onUnban(ban)}>{t('governance.unban')}</button></div>)}
  </section>;
};

export default GovernancePanel;
