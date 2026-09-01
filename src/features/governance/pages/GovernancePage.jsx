import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/governance.css';
import GovernancePanel from '../components/GovernancePanel';
import InviteMemberDialog from '../components/InviteMemberDialog';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getBans, getJoinRequests, reviewJoinRequest, revokeBan } from '../api/governanceApi';
import { createInvitation, getInvitations, resendInvitation, revokeInvitation } from '../../invitations/api/invitationsApi';
import { rotateJoinCode, updateTrip } from '../../trips/api/tripsApi';

/*
  Access/entry control only -- who's asking to join, who's invited, who's
  restricted, and the trip's join policy. Promote/demote/transfer/remove
  are Members-page concerns (see docs/architecture/membership.md's page-
  split rationale); Ban is also initiated from there (MemberActionsMenu
  reuses this feature's own BanMemberDialog/banMember, see MembersPage.jsx)
  rather than duplicated here as a second "moderate members" list, which
  the Stitch reference itself never depicted -- this page's Restricted
  section is read+unban only.
*/
export default function GovernancePage() {
  const { trip, setTrip, tripId } = useOutletContext();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // { kind: 'unban', ban } | null
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const state = useRouteResource(async (signal) => {
    const config = { signal };
    const [requests, invitations, bans] = await Promise.all([
      getJoinRequests(tripId, config),
      getInvitations(tripId, config),
      getBans(tripId, config),
    ]);
    return { requests: requests.results, invitations: invitations.results, bans: bans.results };
  }, [tripId]);

  const run = async (action) => {
    try {
      const result = await action();
      await state.retry();
      return result;
    } catch (e) {
      setError(e);
      return undefined;
    }
  };

  // Capability-driven, never a role guess -- trip.governance_capabilities
  // is server-computed (apps.trips.permissions.governance_capabilities),
  // returned alongside every GET /trips/{id}/ response.
  const capabilities = trip.governance_capabilities || {};
  if (!capabilities.can_view_governance) return <ErrorState message={t('governance.accessDenied')} />;
  if (state.loading) return <NeoLoading />;
  if (state.error) return <ErrorState message={state.error.message} onRetry={state.retry} />;

  const confirmPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await revokeBan(tripId, pending.ban.id);
      await state.retry();
      setPending(null);
    } catch (e) {
      setError(e);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const dialog = pending?.kind === 'unban'
    ? { title: t('governance.confirmUnbanTitle', { name: pending.ban.member?.display_name || t('activity.unknown') }), body: t('governance.confirmUnbanBody'), confirmLabel: t('governance.unban'), destructive: false }
    : null;

  return (
    <>
      {error && <ErrorState message={error.message} />}
      <GovernancePanel
        trip={trip}
        capabilities={capabilities}
        {...state.data}
        onReview={(r, d) => run(() => reviewJoinRequest(tripId, r.id, d))}
        onOpenInvite={() => setInviteOpen(true)}
        onResendInvite={(r) => run(() => resendInvitation(tripId, r.id))}
        onRevokeInvite={(r) => run(() => revokeInvitation(tripId, r.id))}
        onUnban={(ban) => setPending({ kind: 'unban', ban })}
        onUpdateSettings={async (payload) => { const updated = await updateTrip(tripId, payload); setTrip(updated); }}
        onRotateLink={async () => { const updated = await rotateJoinCode(tripId); setTrip(updated); }}
      />
      {inviteOpen && (
        <InviteMemberDialog
          // Deliberately bypasses run() -- unlike the one-click actions
          // above, this dialog owns its own inline field-error handling
          // (already-a-member, banned email, etc.) and needs the real
          // rejection to reach its own try/catch, not have run() swallow
          // it into a page-level banner and resolve as if it succeeded.
          onInvite={async (payload) => {
            const result = await createInvitation(tripId, payload);
            await state.retry();
            return result;
          }}
          onClose={() => setInviteOpen(false)}
        />
      )}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          body={dialog.body}
          confirmLabel={dialog.confirmLabel}
          destructive={dialog.destructive !== false}
          onConfirm={confirmPending}
          onCancel={() => !busy && setPending(null)}
        />
      )}
    </>
  );
}
