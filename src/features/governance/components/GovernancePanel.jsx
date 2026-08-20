import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JoinRequestsSection from './JoinRequestsSection';
import BansSection from './BansSection';

const GovernancePanel = ({ requests, invitations, bans, members, onReview, onInvite, onRevokeInvite, onResendInvite, onKick, onBan, onUnban }) => {
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
    <JoinRequestsSection requests={requests} onReview={onReview} />
    <h3>{t('governance.invitations')}</h3>
    <form onSubmit={invite}><label>{t('governance.inviteEmail')}<input className="pc-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><div className="form-actions"><button className="pc-btn-create">{t('governance.sendInvite')}</button><button type="button" onClick={(event) => invite(event, true)}>{t('governance.guestLink')}</button></div></form>
    {lastLink && <label>{t('governance.copyOnce')}<input className="pc-input" readOnly value={lastLink} onFocus={(event) => event.target.select()} /></label>}
    {invitations.map((row) => <div className="management-row" key={row.id}><span>{row.email || t('governance.guestInvite')}<small>{new Date(row.expires_at).toLocaleDateString()}</small></span>{!row.accepted_at && !row.revoked_at && <div className="row-actions">{row.email && <button onClick={() => onResendInvite(row)}>{t('governance.resend')}</button>}<button onClick={() => onRevokeInvite(row)}>{t('governance.revoke')}</button></div>}</div>)}
    <BansSection members={members} bans={bans} onKick={onKick} onBan={onBan} onUnban={onUnban} />
  </section>;
};

export default GovernancePanel;
