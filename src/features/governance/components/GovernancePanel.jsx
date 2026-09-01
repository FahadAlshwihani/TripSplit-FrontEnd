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
export default function GovernancePanel({ trip, capabilities, requests, invitations, bans, onReview, onOpenInvite, onRevokeInvite, onResendInvite, onUnban, onUpdateSettings, onRotateLink }) {
  const { t } = useTranslation();
  return (
    <div className="governance-layout">
      <div className="governance-layout__title">
        <h1 className="text-display">{t('governance.title')}</h1>
        <p className="text-copy-lg governance-layout__subtitle">{t('governance.subtitle', { tripTitle: trip.title })}</p>
      </div>
      <div className="governance-layout__main">
        <section className="gov-panel gov-panel--requests"><JoinRequestsSection requests={requests} onReview={onReview} canReview={capabilities?.can_review_join_requests} /></section>
        <section className="gov-panel gov-panel--invitations">
          <InvitationsSection
            invitations={invitations}
            onOpenInvite={onOpenInvite}
            onResend={onResendInvite}
            onRevoke={onRevokeInvite}
            canInvite={capabilities?.can_invite}
            canResend={capabilities?.can_resend_invite}
            canRevoke={capabilities?.can_revoke_invite}
          />
        </section>
      </div>
      <div className="governance-layout__side">
        <section className="gov-panel gov-panel--restricted"><BansSection bans={bans} onUnban={onUnban} canUnban={capabilities?.can_unban} /></section>
        <AccessSettingsCard trip={trip} onUpdateSettings={onUpdateSettings} onRotateLink={onRotateLink} capabilities={capabilities} />
      </div>
    </div>
  );
}
