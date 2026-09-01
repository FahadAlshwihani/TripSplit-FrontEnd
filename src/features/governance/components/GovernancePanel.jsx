import React from 'react';
import { useTranslation } from 'react-i18next';
import JoinRequestsSection from './JoinRequestsSection';
import InvitationsSection from './InvitationsSection';
import BansSection from './BansSection';
import AccessSettingsCard from './AccessSettingsCard';

/*
  A literal port of the supplied Stitch Access Control source's page
  canvas -- <div class="mb-xl">{header}</div><div class="grid
  grid-cols-1 lg:grid-cols-12 gap-lg">{main lg:col-span-8}{side
  lg:col-span-4}</div> -- see governance.css's own top-of-file mapping
  comment for the full element-by-element translation. DashboardShell/
  routing/data own everything outside this component tree.
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
        <div className="gov-grid__main">
          <div className="gov-section"><JoinRequestsSection requests={requests} onReview={onReview} canReview={capabilities?.can_review_join_requests} /></div>
          <div className="gov-section">
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
        </div>
        <div className="gov-grid__side">
          <BansSection bans={bans} onUnban={onUnban} canUnban={capabilities?.can_unban} />
          <AccessSettingsCard trip={trip} onUpdateSettings={onUpdateSettings} onRotateLink={onRotateLink} capabilities={capabilities} />
        </div>
      </div>
    </div>
  );
}
