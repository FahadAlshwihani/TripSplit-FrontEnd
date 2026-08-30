import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/governance.css';
import GovernancePanel from '../components/GovernancePanel';
import BanMemberDialog from '../components/BanMemberDialog';
import InviteMemberDialog from '../components/InviteMemberDialog';
import Loading from '../../../components/Loading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { banMember, getBans, getJoinRequests, kickMember, reviewJoinRequest, revokeBan } from '../api/governanceApi';
import { createInvitation, getInvitations, resendInvitation, revokeInvitation } from '../../invitations/api/invitationsApi';
import { getMembers } from '../../members/api/membersApi';
import { rotateJoinCode, updateTrip } from '../../trips/api/tripsApi';

export default function GovernancePage() {
  const { trip, setTrip, tripId, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // { kind: 'kick'|'unban', member|ban } | null
  const [banTarget, setBanTarget] = useState(null); // member | null
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const state = useRouteResource(async (signal) => {
    const config = { signal };
    const [requests, invitations, bans, members] = await Promise.all([
      getJoinRequests(tripId, config),
      getInvitations(tripId, config),
      getBans(tripId, config),
      getMembers(tripId, config),
    ]);
    return { requests: requests.results, invitations: invitations.results, bans: bans.results, members: members.results };
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

  if (!permissions.canManageMembers) return <ErrorState message={t('governance.accessDenied')} />;
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error.message} onRetry={state.retry} />;

  const confirmPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (pending.kind === 'kick') await kickMember(tripId, pending.member.id);
      else if (pending.kind === 'unban') await revokeBan(tripId, pending.ban.id);
      await state.retry();
      setPending(null);
    } catch (e) {
      setError(e);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const dialog = pending?.kind === 'kick'
    ? { title: t('governance.confirmKickTitle', { name: pending.member.display_name }), body: t('governance.confirmKickBody'), confirmLabel: t('governance.kick') }
    : pending?.kind === 'unban'
      ? { title: t('governance.confirmUnbanTitle', { name: pending.ban.member?.display_name || t('activity.unknown') }), body: t('governance.confirmUnbanBody'), confirmLabel: t('governance.unban'), destructive: false }
      : null;

  return (
    <>
      {error && <ErrorState message={error.message} />}
      <GovernancePanel
        trip={trip}
        {...state.data}
        onReview={(r, d) => run(() => reviewJoinRequest(tripId, r.id, d))}
        onOpenInvite={() => setInviteOpen(true)}
        onResendInvite={(r) => run(() => resendInvitation(tripId, r.id))}
        onRevokeInvite={(r) => run(() => revokeInvitation(tripId, r.id))}
        onKick={(member) => setPending({ kind: 'kick', member })}
        onBan={(member) => setBanTarget(member)}
        onUnban={(ban) => setPending({ kind: 'unban', ban })}
        onUpdateSettings={async (payload) => { const updated = await updateTrip(tripId, payload); setTrip(updated); }}
        onRotateLink={async () => { const updated = await rotateJoinCode(tripId); setTrip(updated); }}
      />
      {banTarget && (
        <BanMemberDialog
          member={banTarget}
          onBan={async (payload) => { await run(() => banMember(tripId, banTarget.id, payload)); setBanTarget(null); }}
          onClose={() => setBanTarget(null)}
        />
      )}
      {inviteOpen && (
        <InviteMemberDialog
          onInvite={(p) => run(() => createInvitation(tripId, p))}
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
