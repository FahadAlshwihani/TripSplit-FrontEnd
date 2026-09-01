import React from 'react';
import { useTranslation } from 'react-i18next';
import JoinRequestsSection from './JoinRequestsSection';
import InvitationsSection from './InvitationsSection';
import BansSection from './BansSection';
import AccessSettingsCard from './AccessSettingsCard';

/*
  Originally a literal port of the supplied Stitch Access Control
  source's page canvas -- <div class="grid grid-cols-1 lg:grid-cols-12
  gap-lg">{main lg:col-span-8, two cards stacked}{side lg:col-span-4,
  two cards stacked}</div>. Deliberately departed from that column
  composition on request: Join Requests and Restricted now sit as one
  row-level pair (row 1), Invitations and Access Settings as another
  (row 2), so each pair reads as sibling cards at the same visual
  level rather than one column floating above the other. Each item
  keeps Stitch's literal 8/12 (main/wide) or 4/12 (side/narrow) span --
  only which row it's placed in changed, not the span ratio itself.
  See governance.css's own .gov-grid comment for the grid-row mechanics.
  DashboardShell/routing/data own everything outside this component
  tree.
*/
export default function GovernancePanel({ trip, capabilities, requests, invitations, bans, onReview, onOpenInvite, onRevokeInvite, onResendInvite, onUnban, onUpdateSettings, onRotateLink }) {
  const { t } = useTranslation();
  return (
    <div className="gov-page">
      <div className="gov-header">
        <h1 className="gov-header__title">{t('governance.title')}</h1>
        <p className="gov-header__subtitle">{t('governance.subtitle', { tripTitle: trip.title })}</p>
      </div>
      <div className="gov-grid">
        <div className="gov-section gov-grid__requests">
          <JoinRequestsSection requests={requests} onReview={onReview} canReview={capabilities?.can_review_join_requests} />
        </div>
        <div className="gov-grid__restricted">
          <BansSection bans={bans} onUnban={onUnban} canUnban={capabilities?.can_unban} />
        </div>
        <div className="gov-section gov-grid__invitations">
          <InvitationsSection
            invitations={invitations}
            onOpenInvite={onOpenInvite}
            onResend={onResendInvite}
            onRevoke={onRevokeInvite}
            canInvite={capabilities?.can_invite}
            canResend={capabilities?.can_resend_invite}
            canRevoke={capabilities?.can_revoke_invite}
          />
        </div>
        <div className="gov-grid__access">
          <AccessSettingsCard trip={trip} onUpdateSettings={onUpdateSettings} onRotateLink={onRotateLink} capabilities={capabilities} />
        </div>
      </div>
    </div>
  );
}
