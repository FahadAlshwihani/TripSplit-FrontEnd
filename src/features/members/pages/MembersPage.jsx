import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/members.css';
import MembersPanel from '../components/MembersPanel';
import MemberDetail from '../components/MemberDetail';
import Loading from '../../../components/Loading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getMemberDetail, getMembers, leaveTrip, removeMember, transferOwnership, updateMember } from '../api/membersApi';

/*
  Every destructive/high-impact mutation (promote, demote, remove,
  transfer, leave) goes through a ConfirmDialog before it ever reaches
  the API -- none of these fired with a bare click before. Remove
  additionally fetches the member's own financial statistics first so
  the confirmation can warn when the member still has an open balance
  (removal never clears it -- see member_balance()/deactivate_member()),
  matching the same warning pattern the brief requires before a
  financial-obligation-carrying member is removed.
*/
export default function MembersPage() {
  const { trip, tripId, currentMember } = useOutletContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const state = useRouteResource((signal) => getMembers(tripId, { signal }), [tripId]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // { kind, member, hasBalance } | null
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    try {
      await action();
      await state.retry();
    } catch (e) {
      setError(e);
    }
  };

  const openDetails = (member) => run(async () => setDetail(await getMemberDetail(tripId, member.id)));

  const requestRemove = async (member) => {
    try {
      const full = await getMemberDetail(tripId, member.id);
      setPending({ kind: 'remove', member, hasBalance: Number(full.statistics.current_balance) !== 0 });
    } catch (e) {
      setError(e);
    }
  };

  const confirmPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const { kind, member } = pending;
      if (kind === 'promote') await updateMember(tripId, member.id, { role: 'admin' });
      else if (kind === 'demote') await updateMember(tripId, member.id, { role: 'member' });
      else if (kind === 'remove') await removeMember(tripId, member.id);
      else if (kind === 'transfer') await transferOwnership(tripId, member.id);
      else if (kind === 'leave') { await leaveTrip(tripId); navigate('/'); return; }
      await state.retry();
      setPending(null);
    } catch (e) {
      setError(e);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState message={state.error.message} onRetry={state.retry} />;

  const dialogFor = () => {
    if (!pending) return null;
    const { kind, member, hasBalance } = pending;
    const name = member.display_name;
    if (kind === 'promote') return { title: t('members.confirmPromoteTitle', { name }), body: t('members.confirmPromoteBody'), confirmLabel: t('members.promote'), destructive: false };
    if (kind === 'demote') return { title: t('members.confirmDemoteTitle', { name }), body: t('members.confirmDemoteBody'), confirmLabel: t('members.demote'), destructive: false };
    if (kind === 'transfer') return { title: t('members.confirmTransferTitle'), body: t('members.confirmTransferBody', { name }), confirmLabel: t('members.transfer'), destructive: false };
    if (kind === 'leave') return { title: t('members.confirmLeaveTitle'), body: t('members.confirmLeave'), confirmLabel: t('members.leave') };
    if (kind === 'remove') {
      const body = hasBalance ? `${t('members.confirmRemoveFinancial')} ${t('members.confirmRemoveBody')}` : t('members.confirmRemoveBody');
      return { title: t('members.confirmRemoveTitle', { name }), body, confirmLabel: hasBalance ? t('members.confirmRemoveAnyway') : t('members.remove') };
    }
    return null;
  };
  const dialog = dialogFor();

  return (
    <>
      {error && <ErrorState message={error.message} />}
      <MembersPanel
        members={state.data.results}
        currentMember={currentMember}
        onDetails={openDetails}
        onRole={(member, role) => setPending({ kind: role === 'admin' ? 'promote' : 'demote', member })}
        onRemove={requestRemove}
        onTransfer={(member) => setPending({ kind: 'transfer', member })}
        onLeave={() => setPending({ kind: 'leave', member: currentMember })}
      />
      <MemberDetail detail={detail} currency={trip.currency} tripId={tripId} onClose={() => setDetail(null)} />
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
