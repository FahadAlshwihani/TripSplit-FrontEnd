import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/members.css';
import MembersPanel from '../components/MembersPanel';
import MemberDetail from '../components/MemberDetail';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import BanMemberDialog from '../../governance/components/BanMemberDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getAllMembers, getMemberDetail, getMembers, leaveTrip, removeMember, transferOwnership, updateMember } from '../api/membersApi';
import { banMember } from '../../governance/api/governanceApi';
import { getBalances } from '../../balances/api/balancesApi';

/*
  Desktop master/detail (Stitch's own reference layout): the list on the
  left, the selected member's financial record on the right, both
  visible together via members.css's column grid. Below the mobile
  breakpoint, only ONE surface renders at a time -- but that swap is
  driven by `detailOpen`, a SEPARATE piece of state from `selectedId`,
  not by "a member happens to be selected." `selectedId` always
  defaults to the current viewer once the list loads (desktop needs a
  populated detail panel from the first paint) -- but that default
  selection must never, by itself, force mobile into the detail view.
  `detailOpen` starts false and only flips true from an explicit row
  tap (onSelect), and back to false from Back -- CSS makes it a no-op
  above the mobile breakpoint (.mem-detail-stack's base rule already
  shows it unconditionally there), so desktop behavior is unaffected.

  Every destructive/high-impact mutation (promote, demote, remove,
  transfer, leave, ban) goes through a ConfirmDialog/BanMemberDialog
  before it ever reaches the API. Remove additionally fetches the
  member's own financial statistics first so the confirmation can warn
  when the member still has an open balance (removal never clears it).
*/
export default function MembersPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showHistorical, setShowHistorical] = useState(false);
  const state = useRouteResource(
    (signal) => (showHistorical ? getAllMembers(tripId, { signal }) : getMembers(tripId, { signal })),
    [tripId, showHistorical],
  );
  const balancesState = useRouteResource((signal) => getBalances(tripId, { signal }), [tripId]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // { kind, member, hasBalance } | null
  const [banTarget, setBanTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const members = state.data?.results || [];

  // Default-select the current viewer (or the first member) once the
  // list is loaded, so the desktop detail panel never sits empty --
  // never re-selects out from under an existing choice. Deliberately
  // does NOT touch `detailOpen` -- see the comment above.
  useEffect(() => {
    if (selectedId || !members.length) return;
    setSelectedId(currentMember?.id && members.some((m) => m.id === currentMember.id) ? currentMember.id : members[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    getMemberDetail(tripId, selectedId).then((data) => { if (!cancelled) setDetail(data); }).catch((e) => { if (!cancelled) setError(e); });
    return () => { cancelled = true; };
  }, [tripId, selectedId]);

  const run = async (action) => {
    try {
      await action();
      await Promise.all([state.retry(), balancesState.retry()]);
      if (selectedId) setDetail(await getMemberDetail(tripId, selectedId));
    } catch (e) {
      setError(e);
    }
  };

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
      await run(async () => {});
      setPending(null);
    } catch (e) {
      setError(e);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) return <NeoLoading />;
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

  const balancesByMemberId = Object.fromEntries((balancesState.data?.members || []).map((row) => [row.member_id, row.balance]));

  const roleHandlers = {
    onRole: (member, role) => setPending({ kind: role === 'admin' ? 'promote' : 'demote', member }),
    onRemove: requestRemove,
    onTransfer: (member) => setPending({ kind: 'transfer', member }),
    onLeave: () => setPending({ kind: 'leave', member: currentMember }),
    onBan: (member) => setBanTarget(member),
  };

  return (
    <div className="mem-page">
      <div className="mem-page__header">
        <h1 className="text-display mem-page__title">{t('members.title')}</h1>
        <p className="text-copy-lg mem-page__subtitle">{t('members.subtitle')}</p>
      </div>

      {error && <ErrorState message={error.message} />}
      <div className={`mem-layout${detailOpen ? ' mem-layout--detail-open' : ''}`}>
        <MembersPanel
          members={members}
          currentMember={currentMember}
          currency={trip.currency}
          tripId={tripId}
          canInvite={Boolean(permissions?.canManageMembers)}
          selectedId={selectedId}
          onSelect={(member) => { setSelectedId(member.id); setDetailOpen(true); }}
          balancesByMemberId={balancesByMemberId}
          showHistorical={showHistorical}
          onToggleHistorical={setShowHistorical}
          {...roleHandlers}
        />
        <MemberDetail
          detail={detail}
          currency={trip.currency}
          tripId={tripId}
          currentMember={currentMember}
          onBack={() => setDetailOpen(false)}
          {...roleHandlers}
        />
      </div>
      {banTarget && (
        <BanMemberDialog
          member={banTarget}
          onBan={async (payload) => { await run(() => banMember(tripId, banTarget.id, payload)); setBanTarget(null); }}
          onClose={() => setBanTarget(null)}
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
    </div>
  );
}
