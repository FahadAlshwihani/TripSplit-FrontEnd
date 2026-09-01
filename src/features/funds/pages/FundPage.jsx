import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import CopyLinkButton from '../../../shared/components/CopyLinkButton';
import { tripUrl } from '../../../shared/utils/shareLinks';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getMembers } from '../../members/api/membersApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { getExpenses } from '../../expenses/api/expensesApi';
import { membersById as buildMembersById } from '../../expenses/utils/expensePresentation';
import ExpenseDetailsDrawer from '../../expenses/components/ExpenseDetailsDrawer';
import { getActivity, getActivityPage } from '../../activity/api/activityApi';
import {
  cancelFundingRound, closeFund, completeFundingRound, confirmFundContribution, correctFundContribution, createFund,
  createFundingRound, getFund, previewFundRefund, recordFundContribution, recordFundReimbursement, recordFundRefunds,
  rejectFundContribution, remindContribution, reportFundContribution, retryFundContribution, updateFund, voidFundContribution,
} from '../api/fundsApi';
import FundSetup from '../components/FundSetup';
import FundSummary from '../components/FundSummary';
import EditFundTargetDialog from '../components/EditFundTargetDialog';
import FundHolderCard from '../components/FundHolderCard';
import ChangeHolderDialog from '../components/ChangeHolderDialog';
import FundingRoundComposer from '../components/FundingRoundComposer';
import FundingRoundLedgerCard from '../components/FundingRoundLedgerCard';
import ContributionActionDialog from '../components/ContributionActionDialog';
import FundContributionHistory from '../components/FundContributionHistory';
import ReimbursementSection from '../components/ReimbursementSection';
import FundRefundHistory from '../components/FundRefundHistory';
import RefundDistributionModal from '../components/RefundDistributionModal';
import RecentFundExpenses from '../components/RecentFundExpenses';
import FundHistoryDialog, { FUND_EVENT_TYPES } from '../components/FundHistoryDialog';
// Fund dialogs reuse the exact same field/button/composer primitives
// Expenses' and Balances/Settlements' own dialogs already use
// (.field-control, .field-group, .exp-composer__*, .bal-remind-btn,
// .bal-empty) -- those classes live in each feature's own stylesheet,
// never a global one, so importing them here (same pattern
// BalancesPage.jsx already uses for settlements.css) is what actually
// makes them apply on this route. This was the root cause of every
// "renders as raw/unstyled HTML" symptom: the classes were correct, but
// nothing on the Fund route ever loaded the CSS that defines them. The
// dialog SHELL itself (overlay/card/header/body/footer) is Fund's own
// --fund.css defines .fund-dialog-overlay/.fund-dialog directly, not
// borrowed -- see fund.css's header comment.
import '../../expenses/styles/expenses.css';
import '../../balances/styles/balances.css';
import '../styles/fund.css';

/*
  The Trip Fund is a real accounting subsystem, not a cosmetic page --
  see docs/architecture/fund-accounting.md for the canonical formula and
  every lifecycle this page drives. Category budget PLANNING lives on
  the Expenses Ledger (one canonical category system, not duplicated
  here); "Recent Fund Expenses" below reuses the SAME ExpenseDetailsDrawer
  that page uses, never a second expense-detail UI.

  Dialog architecture: exactly ONE discriminated `fundDialog` state
  drives every Fund modal (create-round / report-contribution /
  record-contribution / change-holder / reimbursement / refund /
  close-confirm / expense-details) -- never a pile of independent
  booleans that can accidentally end up true at the same time. Only one
  primary Fund dialog can ever be mounted at once, by construction.
*/
export default function FundPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const canManage = Boolean(permissions.canManageMembers);
  const [searchParams] = useSearchParams();
  // The optional deep-link focus target (?round=<public round id>) --
  // never anything beyond "which already-loaded round to scroll to and
  // expand". A round from another trip, or one that no longer exists,
  // simply never matches anything in `fund.rounds` below (that array is
  // already trip-scoped server-side) -- see the render below, which
  // silently ignores an unmatched target rather than erroring or
  // leaking cross-trip existence.
  const focusRoundId = searchParams.get('round');
  const hasScrolledToFocusRound = useRef(false);

  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [fund, members, categories, budgets, recentExpenses, activity] = await Promise.all([
      getFund(tripId, config),
      getMembers(tripId, config),
      getCategories(tripId, config),
      getCategoryBudgets(tripId, config),
      getExpenses(tripId, { ...config, params: { payment_source: 'trip_fund', page_size: 5 } }),
      // Fund's own "سجل الصندوق" history dialog reuses the trip-wide
      // activity feed, filtered client-side to Fund event types (see
      // FUND_EVENT_TYPES) -- never a second, parallel audit-log system.
      // A larger page size than the default 25 so Fund events aren't
      // crowded out by unrelated trip activity before client filtering.
      getActivity(tripId, { ...config, params: { page_size: 50 } }),
    ]);
    return { fund, members: members.results, categories: categories.results, budgets: budgets.results, recentExpenses: recentExpenses.results, activity };
  }, [tripId]);

  const [actionError, setActionError] = useState(null);
  // null | { type: 'create-round', prefill? } | { type: 'report-contribution'|'record-contribution', round }
  // | { type: 'change-holder' } | { type: 'reimbursement' } | { type: 'refund' } | { type: 'close-confirm' }
  // | { type: 'expense-details', expense } | { type: 'history' }
  const [fundDialog, setFundDialog] = useState(null);
  const closeDialog = () => setFundDialog(null);
  const [busyKey, setBusyKey] = useState(null); // contribution/round id currently mid-action

  const data = resource.data;
  const fund = data?.fund;
  const members = data?.members || [];
  const categories = data?.categories || [];
  const budgets = data?.budgets || [];
  const recentExpenses = data?.recentExpenses || [];
  const activity = data?.activity || { results: [], next: null };
  const currency = trip.currency;
  const activeMembers = members.filter((member) => member.active);
  const categoriesByCode = Object.fromEntries(categories.map((category) => [category.code, category]));
  const membersLookup = buildMembersById(members);
  const fundEvents = activity.results.filter((event) => FUND_EVENT_TYPES.has(event.event_type));

  const run = async (action) => {
    try {
      const result = await action();
      setActionError(null);
      await resource.retry();
      return result;
    } catch (error) {
      setActionError(error);
      throw error;
    }
  };

  const runBusy = async (key, action) => {
    setBusyKey(key);
    try {
      await run(action);
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateFund = (holderId, targetAmount) => run(() => createFund(tripId, { holder_id: holderId, ...(targetAmount ? { target_amount: targetAmount } : {}) }));

  const handleChangeHolder = async (holderId) => { await run(() => updateFund(tripId, { holder_id: holderId })); closeDialog(); };

  // The ONE place the trip's budget/Fund target is ever changed (see
  // docs/architecture/fund-accounting.md, "The Trip Fund is the
  // budget") -- an explicit, owner/admin-only action, never inferred
  // from creating/completing/cancelling a FundingRound.
  const handleUpdateTarget = async (targetAmount) => { await run(() => updateFund(tripId, { target_amount: targetAmount })); closeDialog(); };

  const openTopUpComposer = () => setFundDialog({ type: 'create-round', prefill: { title: t('fund.topup'), target_amount: fund.accounting.deficit } });

  // A round is a COLLECTION MECHANISM against the trip's explicit
  // budget (see docs/architecture/fund-accounting.md) -- it never
  // defines or changes that budget itself, so this only ever pre-fills
  // the round's target with what's still outstanding
  // (collection_remaining, server-computed from budget - confirmed
  // contributions -- never re-derived here), never the raw budget
  // figure. The user can always type a smaller amount if only a
  // partial collection is intended this round.
  const newRoundPrefill = fund && Number(fund.collection_remaining) > 0
    ? { target_amount: fund.collection_remaining }
    : undefined;

  const handleCreateRound = async (payload) => { await run(() => createFundingRound(tripId, payload)); closeDialog(); };

  const handleContributionSave = async (payload) => {
    const { type, round } = fundDialog;
    if (type === 'report-contribution') await run(() => reportFundContribution(tripId, round.id, payload));
    else await run(() => recordFundContribution(tripId, round.id, payload));
    closeDialog();
  };

  const handleRemind = (round, memberId) => remindContribution(tripId, round.id, memberId);

  const handleConfirmContribution = (round, contribution) => runBusy(contribution.id, () => confirmFundContribution(tripId, round.id, contribution.id));
  const handleRejectContribution = (round, contribution, reason) => runBusy(contribution.id, () => rejectFundContribution(tripId, round.id, contribution.id, reason));
  const handleRetryContribution = (round, contribution) => runBusy(contribution.id, () => retryFundContribution(tripId, round.id, contribution.id));
  // round-independent -- FundContributionHistory is fund-wide, not
  // scoped to one round card, so it only ever has the contribution row
  // itself; round_id lives right on that row already.
  const handleCorrectContribution = (contribution, payload) => runBusy(contribution.id, () => correctFundContribution(tripId, contribution.round_id, contribution.id, payload));
  const handleVoidContribution = (contribution, reason) => runBusy(contribution.id, () => voidFundContribution(tripId, contribution.round_id, contribution.id, reason));

  const handleCompleteRound = (round) => runBusy(round.id, () => completeFundingRound(tripId, round.id));
  const handleCancelRound = (round) => runBusy(round.id, () => cancelFundingRound(tripId, round.id));

  const handlePreviewRefund = (payload) => previewFundRefund(tripId, payload);
  const handleRecordRefund = async (payload) => { await run(() => recordFundRefunds(tripId, payload)); closeDialog(); };

  const handleRecordReimbursement = async (payload) => { await run(() => recordFundReimbursement(tripId, payload)); closeDialog(); };

  const handleCloseFund = async () => { await run(() => closeFund(tripId)); closeDialog(); };

  const loadMoreActivity = () => resource.loadMore(
    (signal) => getActivityPage(activity.next, tripId, { signal }),
    (current, page) => ({ ...current, activity: { ...page, results: [...current.activity.results, ...page.results] } }),
  );

  const openRounds = fund ? fund.rounds.filter((round) => round.status === 'open') : [];
  const completedRounds = fund ? fund.rounds.filter((round) => round.status !== 'open') : [];
  const deficit = fund ? Number(fund.accounting.deficit) : 0;

  // Scrolls to the deep-link target ONLY after the Fund shell has
  // already rendered with real round data -- never blocks the page
  // waiting for it (brief item 36). Runs once per mount/target so a
  // later background refetch (a mutation's own resource.retry()) never
  // re-yanks the viewport back to a round the member has since
  // scrolled away from.
  useEffect(() => {
    if (!focusRoundId || hasScrolledToFocusRound.current || !fund) return;
    const matches = fund.rounds.some((round) => round.id === focusRoundId);
    if (!matches) return;
    hasScrolledToFocusRound.current = true;
    document.getElementById(`fund-round-${focusRoundId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusRoundId, fund]);

  return (
    <div className="fund-page">
      <header className="fund-page__header">
        <div>
          <h1 className="fund-page__title text-display">{t('fund.title')}</h1>
          <p className="fund-page__subtitle text-copy-lg">{t('fund.pageSubtitle')}</p>
        </div>
        {fund && (
          <div className="fund-page__header-actions">
            <CopyLinkButton url={tripUrl(trip.short_code, '/fund')} label={t('fund.copyLink')} />
            <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setFundDialog({ type: 'history' })}>
              <i className="bi bi-clock-history" aria-hidden="true" /> {t('fund.historyTitle')}
            </button>
            {canManage && fund.status === 'active' && (
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => setFundDialog({ type: 'create-round', prefill: newRoundPrefill })}>
                <i className="bi bi-plus-lg" aria-hidden="true" /> {t('fund.newRound')}
              </button>
            )}
          </div>
        )}
      </header>

      <p className="fund-page__hint"><i className="bi bi-info-circle" aria-hidden="true" />{t('fund.explanation')}</p>

      {actionError && <ErrorState message={actionError.message} />}

      {!data && resource.loading && <SectionLoading minHeight={280} />}
      {!data && resource.error && <ErrorState message={resource.error.message} onRetry={resource.retry} />}

      {data && !fund && (
        <FundSetup canManage={canManage} activeMembers={activeMembers} currentMember={currentMember} onCreate={handleCreateFund} />
      )}
      {data && fund && (
        <>
          {deficit > 0 && fund.status === 'active' && (
            <div className="fund-shortfall" role="alert">
              <div className="fund-shortfall__text">
                <strong className="fund-shortfall__title"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {t('fund.shortfallTitle')}</strong>
                <p className="fund-shortfall__body">{t('fund.shortfallBody', { amount: deficit.toFixed(2), currency })}</p>
              </div>
              {canManage && <button type="button" className="dash-btn dash-btn--danger" onClick={openTopUpComposer}>{t('fund.createTopup')}</button>}
            </div>
          )}

          <FundSummary
            accounting={fund.accounting}
            targetAmount={fund.total_target}
            collected={fund.accounting.collected}
            collectionRemaining={fund.collection_remaining}
            currency={currency}
            canManage={canManage}
            onEditTarget={() => setFundDialog({ type: 'edit-target' })}
          />

          <FundHolderCard holder={fund.holder} canManage={canManage} onChangeHolder={() => setFundDialog({ type: 'change-holder' })} />

          <section className="fund-section">
            <h2 className="fund-section__title text-headline-md">{t('fund.roundsLedgerTitle')}</h2>
            {fund.rounds.length === 0 ? (
              <div className="bal-empty">
                <i className="bi bi-piggy-bank bal-empty__icon" aria-hidden="true" />
                <h3 className="bal-empty__title text-headline-sm">{t('fund.emptyRoundsTitle')}</h3>
                <p className="bal-empty__body">{t('fund.emptyRoundsBody')}</p>
                {canManage && (
                  <button type="button" className="dash-btn dash-btn--primary" onClick={() => setFundDialog({ type: 'create-round', prefill: newRoundPrefill })}>
                    <i className="bi bi-plus-lg" aria-hidden="true" /> {t('fund.newRound')}
                  </button>
                )}
              </div>
            ) : (
              <div className="fund-rounds">
                {openRounds.map((round) => (
                  <FundingRoundLedgerCard
                    key={round.id}
                    round={round}
                    contributions={fund.contributions.filter((row) => row.round_id === round.id)}
                    currency={currency}
                    currentMember={currentMember}
                    canManage={canManage}
                    busyKey={busyKey}
                    shortCode={trip.short_code}
                    onReport={() => setFundDialog({ type: 'report-contribution', round })}
                    onRecord={() => setFundDialog({ type: 'record-contribution', round })}
                    onRemind={(memberId) => handleRemind(round, memberId)}
                    onConfirm={(contribution) => handleConfirmContribution(round, contribution)}
                    onReject={(contribution, reason) => handleRejectContribution(round, contribution, reason)}
                    onRetry={(contribution) => handleRetryContribution(round, contribution)}
                    onComplete={() => handleCompleteRound(round)}
                    onCancel={() => handleCancelRound(round)}
                  />
                ))}
                {completedRounds.map((round) => (
                  <FundingRoundLedgerCard
                    key={round.id}
                    round={round}
                    contributions={fund.contributions.filter((row) => row.round_id === round.id)}
                    currency={currency}
                    currentMember={currentMember}
                    canManage={canManage}
                    collapsedByDefault
                    forceExpanded={round.id === focusRoundId}
                    busyKey={busyKey}
                    shortCode={trip.short_code}
                  />
                ))}
              </div>
            )}
          </section>

          <FundContributionHistory
            contributions={fund.contributions}
            currency={currency}
            canManage={canManage && fund.status === 'active'}
            onCorrect={handleCorrectContribution}
            onVoid={handleVoidContribution}
          />

          <div className="fund-two-col">
            <ReimbursementSection
              reimbursements={fund.reimbursements}
              candidates={fund.reimbursement_candidates}
              currency={currency}
              canManage={canManage && fund.status === 'active'}
              onOpen={() => setFundDialog({ type: 'reimbursement' })}
            />
            <FundRefundHistory refunds={fund.refunds} currency={currency} />
          </div>

          <RecentFundExpenses
            expenses={recentExpenses}
            categoriesByCode={categoriesByCode}
            currency={currency}
            tripId={tripId}
            onOpen={(expense) => setFundDialog({ type: 'expense-details', expense })}
          />

          {Number(fund.accounting.surplus) > 0 && fund.status === 'active' && (
            <div className="fund-surplus-action">
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => setFundDialog({ type: 'refund' })}>
                <i className="bi bi-arrow-return-left" aria-hidden="true" /> {t('fund.refund')}
              </button>
            </div>
          )}

          {canManage && fund.status === 'active' && (
            <div className="fund-close-action">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setFundDialog({ type: 'close-confirm' })} disabled={!fund.close_readiness.ready}>
                {t('fund.close')}
              </button>
              {!fund.close_readiness.ready && <p className="fund-close-action__hint text-copy-sm">{t('fund.closeNotReady')}</p>}
            </div>
          )}
        </>
      )}

      {fundDialog?.type === 'create-round' && (
        <FundingRoundComposer
          members={activeMembers}
          currency={currency}
          prefill={fundDialog.prefill}
          onSubmit={handleCreateRound}
          onClose={closeDialog}
        />
      )}

      {(fundDialog?.type === 'report-contribution' || fundDialog?.type === 'record-contribution') && (
        <ContributionActionDialog
          mode={fundDialog.type === 'report-contribution' ? 'report' : 'record'}
          round={fundDialog.round}
          members={activeMembers}
          currentMember={currentMember}
          currency={currency}
          onSave={handleContributionSave}
          onClose={closeDialog}
        />
      )}

      {fundDialog?.type === 'change-holder' && (
        <ChangeHolderDialog holder={fund.holder} activeMembers={activeMembers} onSave={handleChangeHolder} onClose={closeDialog} />
      )}

      {fundDialog?.type === 'edit-target' && (
        <EditFundTargetDialog currentTarget={fund.total_target} collected={fund.accounting.collected} currency={currency} onSave={handleUpdateTarget} onClose={closeDialog} />
      )}

      {fundDialog?.type === 'reimbursement' && (
        <ReimbursementSection.Dialog
          candidates={fund.reimbursement_candidates}
          members={activeMembers}
          currency={currency}
          onSave={handleRecordReimbursement}
          onClose={closeDialog}
        />
      )}

      {fundDialog?.type === 'refund' && (
        <RefundDistributionModal
          available={fund.accounting.surplus}
          currency={currency}
          onPreview={handlePreviewRefund}
          onConfirm={handleRecordRefund}
          onClose={closeDialog}
        />
      )}

      {fundDialog?.type === 'close-confirm' && (
        <ConfirmDialog
          title={t('fund.closeConfirmTitle')}
          body={t('fund.closeConfirmBody')}
          confirmLabel={t('fund.close')}
          destructive={false}
          onConfirm={handleCloseFund}
          onCancel={closeDialog}
        />
      )}

      {fundDialog?.type === 'history' && (
        <FundHistoryDialog
          events={fundEvents}
          hasMore={Boolean(activity.next)}
          loadingMore={resource.loadingMore}
          onLoadMore={loadMoreActivity}
          onClose={closeDialog}
        />
      )}

      {fundDialog?.type === 'expense-details' && (
        // View-only from the Fund page (canEdit/canCreateExpense=false
        // correctly HIDES the Edit/Duplicate/Delete buttons entirely --
        // see ExpenseDetailsDrawer.jsx -- never a dead/broken button):
        // editing a Fund-paid expense's participants/payment source is a
        // full Expense Composer operation that belongs on the Expenses
        // Ledger, not partially reimplemented here.
        <ExpenseDetailsDrawer
          expense={fundDialog.expense}
          category={categoriesByCode[fundDialog.expense.category]}
          budget={budgets.find((row) => row.category === fundDialog.expense.category)}
          membersById={membersLookup}
          currency={currency}
          canEdit={false}
          canCreateExpense={false}
          onEdit={() => {}}
          onDuplicate={() => {}}
          onDelete={() => {}}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
