import React from 'react';
import { useTranslation } from 'react-i18next';
import JoinRequestsSection from './JoinRequestsSection';
import InvitationsSection from './InvitationsSection';
import BansSection from './BansSection';
import AccessSettingsCard from './AccessSettingsCard';

/*
  Stitch's Access Control layout: MAIN column (Join Requests, Pending
  Invitations) + SIDE column (Restricted/Banned, Access Settings) on
  desktop, all four sections simply stacked in that same order on
  mobile (governance.css collapses the grid below the breakpoint) --
  never a cramped side column at narrow widths.
*/
export default function GovernancePanel({ trip, requests, invitations, bans, members, onReview, onOpenInvite, onRevokeInvite, onResendInvite, onKick, onBan, onUnban, onUpdateSettings, onRotateLink }) {
  const { t } = useTranslation();
  return (
    <div className="governance-layout">
      <h2 className="governance-layout__title">{t('governance.title')}</h2>
      <div className="governance-layout__main">
        <section className="card-pc"><JoinRequestsSection requests={requests} onReview={onReview} /></section>
        <section className="card-pc"><InvitationsSection invitations={invitations} onOpenInvite={onOpenInvite} onResend={onResendInvite} onRevoke={onRevokeInvite} /></section>
      </div>
      <div className="governance-layout__side">
        <section className="card-pc"><BansSection members={members} bans={bans} onKick={onKick} onBan={onBan} onUnban={onUnban} /></section>
        <AccessSettingsCard trip={trip} onUpdateSettings={onUpdateSettings} onRotateLink={onRotateLink} />
      </div>
    </div>
  );
}
