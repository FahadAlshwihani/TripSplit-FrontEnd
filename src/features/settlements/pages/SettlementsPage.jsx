import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getMembers } from '../../members/api/membersApi';
import { getBalances } from '../../balances/api/balancesApi';
import { getSettlementPage, getSettlements, recordAdminSettlement, reportPayment, recordReceivedPayment, reviewSettlement } from '../api/settlementsApi';
import SettlementActionDialog from '../components/SettlementActionDialog';
import SettlementTimelineDrawer from '../components/SettlementTimelineDrawer';
import CurrentBalancesCard from '../components/CurrentBalancesCard';
import SuggestedSettlementsCard from '../components/SuggestedSettlementsCard';
import SettlementLedgerCard from '../components/SettlementLedgerCard';
import '../styles/settlements.css';

/*
  A literal port of the supplied Stitch "Settle Up" source's page
  canvas: header, then a 7/12+5/12 workspace -- Current Balances +
  Suggested Settlements on the left, the permanent Settlement Ledger
  timeline on the right (see settlements.css's own mapping comment).
  Domain logic is entirely untouched -- this is a presentational
  rebuild over the same GET /balances/, GET /settlements/, and
  reportPayment/recordReceivedPayment/recordAdminSettlement/
  reviewSettlement calls the previous flat-list page already used.

  Current Balances and Suggested Settlements read straight off
  GET /trips/{id}/balances/'s own `members`/`suggested_settlements`
  fields (apps.expenses.balances.calculate_balances()/simplify_debts()'s
  own output) -- never recomputed here. The Settlement Ledger is the
  separate historical record (GET /trips/{id}/settlements/, all
  statuses, newest first) -- a Fund reimbursement that zeroes a
  personal balance is reflected in Current Balances/Suggested
  Settlements (both balance-derived) but never appears here, since it
  never creates a Settlement row (see apps.funds.services.
  record_reimbursement's own docstring).

  Per-settlement action capability is still client-derived
  (canReview/canCancel/canRetry below) -- audited against the real
  backend authorization in apps.expenses.settlements.py
  (review_settlement/cancel_settlement/retry_settlement) and confirmed
  to encode the identical rule (recipient-or-manager / reporter-or-
  manager); this is a known duplication, not a gap, so no new
  capabilities field was added for this pass.

  Exactly one settlement overlay can ever be mounted at a time -- both
  the timeline drawer and the action dialog are driven off this single
  discriminated `overlay` slot (never two independent booleans), so
  there is no code path where both could mount simultaneously.
*/
export default function SettlementsPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // null | { type: 'timeline', id } | { type: 'action', mode, counterpart?, debt?, initialFromId?, initialToId? }
  const [overlay, setOverlay] = useState(null);
  const [searchParams] = useSearchParams();
  // ?settlement=<public settlement id> -- opens straight to that
  // settlement's timeline drawer once the ledger has loaded. Never
  // executes any mutation by itself (confirm/cancel/retry all still
  // require the viewer's own explicit click inside the drawer); an id
  // that doesn't match anything in this trip's own already-loaded
  // settlements (wrong id, or one from another trip -- settlements is
  // already trip-scoped server-side) is silently ignored.
  const focusSettlementId = searchParams.get('settlement');
  const hasOpenedFocusSettlement = useRef(false);

  // Three independent resources, one per card -- each has its own
  // shell/SectionLoading/error state rather than one combined fetch
  // blocking the whole workspace. Current Balances and Suggested
  // Settlements both read off the same GET /balances/ payload (they
  // are two views of one server response, not two round trips), so
  // they share balancesResource but each still renders its own
  // section-scoped loading/error independently of the other cards.
  const balancesResource = useRouteResource((signal) => getBalances(tripId, { signal }), [tripId]);
  const membersResource = useRouteResource((signal) => getMembers(tripId, { signal }), [tripId]);
  const settlementsResource = useRouteResource(
    (signal) => getSettlements(tripId, { signal, params: { page_size: 25 } }),
    [tripId],
  );

  const balances = balancesResource.data;
  const members = membersResource.data?.results || [];
  const settlements = settlementsResource.data?.results || [];
  const currency = trip.currency;
  const readOnly = !permissions.canRecordSettlement;
  const isManager = ['owner', 'admin'].includes(currentMember?.role);
  const canRecordAdmin = !readOnly && isManager;
  const membersById = Object.fromEntries(members.map((member) => [member.id, member]));

  const loadMore = () => settlementsResource.loadMore(
    (signal) => getSettlementPage(settlementsResource.data.next, tripId, { signal }),
    (current, page) => ({ ...page, results: [...current.results, ...page.results] }),
  );

  // Opens the deep-link target ONLY after the ledger has already
  // rendered with real data -- never blocks the page waiting for it
  // (matches Fund's own ?round= handling). Runs once per mount/target
  // so a later background refetch never re-yanks a drawer the viewer
  // has since closed back open.
  useEffect(() => {
    if (!focusSettlementId || hasOpenedFocusSettlement.current || !settlementsResource.data) return;
    const matches = settlements.some((row) => row.id === focusSettlementId);
    if (!matches) return;
    hasOpenedFocusSettlement.current = true;
    setOverlay({ type: 'timeline', id: focusSettlementId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSettlementId, settlementsResource.data]);

  const runReview = async (settlement, decision) => {
    setBusyId(settlement.id);
    try {
      await reviewSettlement(tripId, settlement.id, decision);
      setActionError(null);
      await settlementsResource.retry();
      setOverlay(null);
    } catch (error) {
      setActionError(error);
    } finally {
      setBusyId(null);
    }
  };

  // Resolves which of the three existing settlement flows a suggestion's
  // Record action should open, from the current viewer's own
  // relationship to that specific debtor/creditor pair -- never a new
  // workflow, just routing into report/received/admin exactly as
  // BalancesPage already does for its own Remind/I-Paid/Record-Received
  // buttons.
  const resolveSuggestionAction = (suggestion) => {
    if (readOnly || !membersResource.data) return null;
    if (currentMember?.id === suggestion.from_member) return { mode: 'report', counterpart: membersById[suggestion.to_member], debt: suggestion.amount };
    if (currentMember?.id === suggestion.to_member) return { mode: 'received', counterpart: membersById[suggestion.from_member], debt: suggestion.amount };
    if (isManager) return { mode: 'admin', initialFromId: suggestion.from_member, initialToId: suggestion.to_member, debt: suggestion.amount };
    return null;
  };
  const suggestionRecordLabel = (suggestion) => {
    if (currentMember?.id === suggestion.from_member) return t('settlements.recordActionPay');
    if (currentMember?.id === suggestion.to_member) return t('settlements.recordActionReceive');
    return t('settlements.record');
  };

  const handleDialogSave = async (payload) => {
    if (overlay.mode === 'report') await reportPayment(tripId, payload);
    else if (overlay.mode === 'received') await recordReceivedPayment(tripId, payload);
    else await recordAdminSettlement(tripId, payload);
    setOverlay(null);
    setActionError(null);
    await Promise.all([balancesResource.retry(), settlementsResource.retry()]);
  };

  const timelineSettlement = overlay?.type === 'timeline' && settlements.find((row) => row.id === overlay.id);
  const timelineCaps = timelineSettlement ? {
    canReview: !readOnly && timelineSettlement.status === 'pending' && (timelineSettlement.to_member_id === currentMember?.id || isManager),
    canCancel: !readOnly && timelineSettlement.status === 'pending' && (timelineSettlement.created_by === currentMember?.id || isManager),
    // A rejected settlement whose pairwise debt has since been resolved
    // (is_resolved, server-derived off the live balance engine -- see
    // apps.expenses.settlements.settlement_is_resolved) is historical
    // only: retrying it would reopen a dead settlement and re-notify the
    // creditor about a debt that no longer exists.
    canRetry: !readOnly && timelineSettlement.status === 'rejected' && !timelineSettlement.is_resolved && (timelineSettlement.created_by === currentMember?.id || isManager),
  } : null;

  return (
    <div className="settle-page">
      <div className="settle-page__header">
        <div>
          <h1 className="settle-page__title text-display">{t('settlements.pageTitle')}</h1>
          <p className="settle-page__subtitle text-copy">{t('settlements.pageSubtitle')}</p>
        </div>
        {canRecordAdmin && (
          <button
            type="button"
            className="dash-btn dash-btn--secondary settle-page__record-external"
            onClick={() => setOverlay({ type: 'action', mode: 'admin' })}
          >
            <span className="material-symbols-outlined settle-icon-inline" aria-hidden="true">fact_check</span> {t('settlements.recordExternal')}
          </button>
        )}
      </div>

      {actionError && <ErrorState message={actionError.message} />}

      <div className="settle-workspace">
        <div className="settle-workspace__left">
          {!balances && balancesResource.loading && <SectionLoading minHeight={180} />}
          {!balances && balancesResource.error && <ErrorState message={balancesResource.error.message} onRetry={balancesResource.retry} />}
          {balances && <CurrentBalancesCard members={balances.members} currency={currency} />}

          {!balances && balancesResource.loading && <SectionLoading minHeight={180} />}
          {!balances && balancesResource.error && <ErrorState message={balancesResource.error.message} onRetry={balancesResource.retry} />}
          {balances && (
            <SuggestedSettlementsCard
              suggestions={balances.suggested_settlements}
              currency={currency}
              canRecord={(suggestion) => resolveSuggestionAction(suggestion) !== null}
              recordLabel={suggestionRecordLabel}
              onRecord={(suggestion) => {
                const action = resolveSuggestionAction(suggestion);
                if (action) setOverlay({ type: 'action', ...action });
              }}
            />
          )}
        </div>
        <div className="settle-workspace__right">
          {!settlementsResource.data && settlementsResource.loading && <SectionLoading minHeight={320} />}
          {!settlementsResource.data && settlementsResource.error && <ErrorState message={settlementsResource.error.message} onRetry={settlementsResource.retry} />}
          {settlementsResource.data && (
            <SettlementLedgerCard
              settlements={settlements}
              currency={currency}
              onOpen={(settlement) => setOverlay({ type: 'timeline', id: settlement.id })}
              hasMore={Boolean(settlementsResource.data.next)}
              onLoadMore={loadMore}
              loadingMore={settlementsResource.loadingMore}
            />
          )}
        </div>
      </div>

      {overlay?.type === 'timeline' && timelineSettlement && (
        <SettlementTimelineDrawer
          tripId={tripId}
          shortCode={trip.short_code}
          tripName={trip.title}
          settlement={timelineSettlement}
          currency={currency}
          onClose={() => setOverlay(null)}
          busy={busyId === timelineSettlement.id}
          {...timelineCaps}
          onConfirm={(row) => runReview(row, 'confirm')}
          onNotReceived={(row) => runReview(row, 'not-received')}
          onCheckLater={(row) => runReview(row, 'check-later')}
          onCancel={(row) => runReview(row, 'cancel')}
          onRetry={(row) => runReview(row, 'retry')}
        />
      )}

      {overlay?.type === 'action' && (
        <SettlementActionDialog
          mode={overlay.mode}
          members={members}
          currentMember={currentMember}
          currency={currency}
          counterpart={overlay.counterpart}
          debt={overlay.debt}
          initialFromId={overlay.initialFromId}
          initialToId={overlay.initialToId}
          onSave={handleDialogSave}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}
