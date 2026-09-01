import React from 'react';
import { useTranslation } from 'react-i18next';
import JoinRequestsSection from './JoinRequestsSection';
import InvitationsSection from './InvitationsSection';
import BansSection from './BansSection';
import AccessSettingsCard from './AccessSettingsCard';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';

const SectionBody = ({ state, minHeight, children }) => {
  if (!state.data && state.loading) return <SectionLoading minHeight={minHeight} />;
  if (!state.data && state.error) return <ErrorState message={state.error.message} onRetry={state.retry} />;
  if (!state.data) return null;
  return children(state.data.results);
};

/*
  A literal port of the supplied Stitch Access Control source's page
  canvas -- <div class="mb-xl">{header}</div><div class="grid
  grid-cols-1 lg:grid-cols-12 gap-lg">{main lg:col-span-8}{side
  lg:col-span-4}</div> -- see governance.css's own top-of-file mapping
  comment for the full element-by-element translation. DashboardShell/
  routing/data own everything outside this component tree.

  A later pass tried restructuring this into row-level pairing (Join
  Requests+Restricted as one row, Invitations+Access Settings as
  another) plus a CSS-subgrid card-height-matching mechanism. Both were
  reverted on request -- the original Stitch main/side column
  composition was already correct, and matching Restricted's height to
  Join Requests never actually required restructuring the page. The
  only thing kept from those two passes is the avatar's shape (square,
  not circular) and position (still beside the identity text) -- see
  JoinRequestsSection.jsx's own comment.
*/
export default function GovernancePanel({ trip, capabilities, requestsState, invitationsState, bansState, onReview, onOpenInvite, onRevokeInvite, onResendInvite, onUnban, onUpdateSettings, onRotateLink }) {
  const { t } = useTranslation();
  return (
    <div className="gov-page">
      <div className="gov-header">
        <h1 className="gov-header__title">{t('governance.title')}</h1>
        <p className="gov-header__subtitle">{t('governance.subtitle', { tripTitle: trip.title })}</p>
      </div>
      <div className="gov-grid">
        <div className="gov-grid__main">
          <div className="gov-section">
            <SectionBody state={requestsState} minHeight={160}>
              {(requests) => <JoinRequestsSection requests={requests} onReview={onReview} canReview={capabilities?.can_review_join_requests} />}
            </SectionBody>
          </div>
          <div className="gov-section">
            <SectionBody state={invitationsState} minHeight={160}>
              {(invitations) => (
                <InvitationsSection
                  invitations={invitations}
                  onOpenInvite={onOpenInvite}
                  onResend={onResendInvite}
                  onRevoke={onRevokeInvite}
                  canInvite={capabilities?.can_invite}
                  canResend={capabilities?.can_resend_invite}
                  canRevoke={capabilities?.can_revoke_invite}
                />
              )}
            </SectionBody>
          </div>
        </div>
        <div className="gov-grid__side">
          <SectionBody state={bansState} minHeight={120}>
            {(bans) => <BansSection bans={bans} onUnban={onUnban} canUnban={capabilities?.can_unban} />}
          </SectionBody>
          <AccessSettingsCard trip={trip} onUpdateSettings={onUpdateSettings} onRotateLink={onRotateLink} capabilities={capabilities} />
        </div>
      </div>
    </div>
  );
}
