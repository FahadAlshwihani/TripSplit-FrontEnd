import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getMembers } from '../../members/api/membersApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { getExpenses } from '../../expenses/api/expensesApi';
import { membersById as buildMembersById } from '../../expenses/utils/expensePresentation';
import ExpenseDetailsDrawer from '../../expenses/components/ExpenseDetailsDrawer';
import {
  cancelFundingRound, closeFund, completeFundingRound, confirmFundContribution, correctFundContribution, createFund,
  createFundingRound, getFund, previewFundRefund, recordFundContribution, recordFundReimbursement, recordFundRefunds,
  rejectFundContribution, remindContribution, reportFundContribution, retryFundContribution, updateFund, voidFundContribution,
} from '../api/fundsApi';
import FundSetup from '../components/FundSetup';
import FundSummary from '../components/FundSummary';
import FundHolderCard from '../components/FundHolderCard';
import FundingRoundComposer from '../components/FundingRoundComposer';
import FundingRoundLedgerCard from '../components/FundingRoundLedgerCard';
import ContributionActionDialog from '../components/ContributionActionDialog';
import FundContributionHistory from '../components/FundContributionHistory';
import ReimbursementSection from '../components/ReimbursementSection';
import FundRefundHistory from '../components/FundRefundHistory';
import RefundDistributionModal from '../components/RefundDistributionModal';
import RecentFundExpenses from '../components/RecentFundExpenses';
import '../styles/fund.css';

/*
  The Trip Fund is a real accounting subsystem, not a cosmetic page --
  see docs/architecture/fund-accounting.md for the canonical formula and
  every lifecycle this page drives. Category budget PLANNING lives on
  the Expenses Ledger (one canonical category system, not duplicated
  here); "Recent Fund Expenses" below reuses the SAME ExpenseDetailsDrawer
  that page uses, never a second expense-detail UI.
*/
export default function FundPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const canManage = Boolean(permissions.canManageMembers);

  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [fund, members, categories, budgets, recentExpenses] = await Promise.all([
      getFund(tripId, config),
      getMembers(tripId, config),
      getCategories(tripId, config),
      getCategoryBudgets(tripId, config),
      getExpenses(tripId, { ...config, params: { payment_source: 'trip_fund', page_size: 5 } }),
    ]);
    return { fund, members: members.results, categories: categories.results, budgets: budgets.results, recentExpenses: recentExpenses.results };
  }, [tripId]);

  const [actionError, setActionError] = useState(null);
  const [roundComposerOpen, setRoundComposerOpen] = useState(false);
  const [roundComposerPrefill, setRoundComposerPrefill] = useState(null);
  const [contributionDialog, setContributionDialog] = useState(null); // { mode: 'report'|'record', round } | null
  const [reimbursementOpen, setReimbursementOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [busyKey, setBusyKey] = useState(null); // contribution/round id currently mid-action
  const [detailsExpense, setDetailsExpense] = useState(null);

  if (resource.loading) return <NeoLoading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const { fund, members, categories, budgets, recentExpenses } = resource.data;
  const currency = trip.currency;
  const activeMembers = members.filter((member) => member.active);
  const categoriesByCode = Object.fromEntries(categories.map((category) => [category.code, category]));
  const membersLookup = buildMembersById(members);

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

  const handleCreateFund = (holderId) => run(() => createFund(tripId, { holder_id: holderId }));
  const handleChangeHolder = (holderId) => run(() => updateFund(tripId, { holder_id: holderId }));

  const openTopUpComposer = () => {
    setRoundComposerPrefill({ title: t('fund.topup'), target_amount: fund.accounting.deficit });
    setRoundComposerOpen(true);
  };
  const handleCreateRound = async (payload) => {
    await run(() => createFundingRound(tripId, payload));
    setRoundComposerOpen(false);
    setRoundComposerPrefill(null);
  };

  const handleContributionSave = async (round, payload, mode) => {
    if (mode === 'report') await recordAndRetry(() => reportFundContribution(tripId, round.id, payload));
    else await recordAndRetry(() => recordFundContribution(tripId, round.id, payload));
    setContributionDialog(null);
  };
  const recordAndRetry = (action) => run(action);

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
  const handleRecordRefund = async (payload) => { await run(() => recordFundRefunds(tripId, payload)); setRefundOpen(false); };

  const handleRecordReimbursement = async (payload) => { await run(() => recordFundReimbursement(tripId, payload)); setReimbursementOpen(false); };

  const handleCloseFund = async () => { await run(() => closeFund(tripId)); setCloseConfirmOpen(false); };

  const openRounds = fund ? fund.rounds.filter((round) => round.status === 'open') : [];
  const completedRounds = fund ? fund.rounds.filter((round) => round.status !== 'open') : [];
  const deficit = fund ? Number(fund.accounting.deficit) : 0;

  return (
    <div className="fund-page">
      <header className="fund-page__header">
        <div>
          <h1 className="fund-page__title text-display">{t('fund.title')}</h1>
          <p className="fund-page__subtitle text-copy-lg">{t('fund.pageSubtitle')}</p>
        </div>
        {fund && canManage && fund.status === 'active' && (
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => setRoundComposerOpen(true)}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> {t('fund.newRound')}
          </button>
        )}
      </header>

      <p className="fund-page__hint"><i className="bi bi-info-circle" aria-hidden="true" />{t('fund.explanation')}</p>

      {actionError && <ErrorState message={actionError.message} />}

      {!fund ? (
        <FundSetup canManage={canManage} activeMembers={activeMembers} currentMember={currentMember} onCreate={handleCreateFund} />
      ) : (
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

          <FundSummary accounting={fund.accounting} currency={currency} />

          <FundHolderCard holder={fund.holder} activeMembers={activeMembers} canManage={canManage} onChangeHolder={handleChangeHolder} />

          <section className="fund-section">
            <h2 className="fund-section__title text-headline-md">{t('fund.roundsLedgerTitle')}</h2>
            {fund.rounds.length === 0 ? (
              <div className="bal-empty">
                <i className="bi bi-piggy-bank bal-empty__icon" aria-hidden="true" />
                <h3 className="bal-empty__title text-headline-sm">{t('fund.emptyRoundsTitle')}</h3>
                <p className="bal-empty__body">{t('fund.emptyRoundsBody')}</p>
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
                    onReport={() => setContributionDialog({ mode: 'report', round })}
                    onRecord={() => setContributionDialog({ mode: 'record', round })}
                    onRemind={(memberId) => handleRemind(round, memberId)}
                    onConfirm={(contribution) => handleConfirmContribution(round, contribution)}
                    onReject={(contribution, reason) => handleRejectContribution(round, contribution, reason)}
                    onRetry={(contribution) => handleRetryContribution(round, contribution)}
                    onCorrect={(contribution, payload) => handleCorrectContribution(round, contribution, payload)}
                    onVoid={(contribution, reason) => handleVoidContribution(round, contribution, reason)}
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
                    busyKey={busyKey}
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
              onOpen={() => setReimbursementOpen(true)}
            />
            <FundRefundHistory refunds={fund.refunds} currency={currency} />
          </div>

          <RecentFundExpenses
            expenses={recentExpenses}
            categoriesByCode={categoriesByCode}
            currency={currency}
            tripId={tripId}
            onOpen={(expense) => setDetailsExpense(expense)}
          />

          {Number(fund.accounting.surplus) > 0 && fund.status === 'active' && (
            <div className="fund-surplus-action">
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => setRefundOpen(true)}>
                <i className="bi bi-arrow-return-left" aria-hidden="true" /> {t('fund.refund')}
              </button>
            </div>
          )}

          {canManage && fund.status === 'active' && (
            <div className="fund-close-action">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setCloseConfirmOpen(true)} disabled={!fund.close_readiness.ready}>
                {t('fund.close')}
              </button>
              {!fund.close_readiness.ready && <p className="fund-close-action__hint text-copy-sm">{t('fund.closeNotReady')}</p>}
            </div>
          )}
        </>
      )}

      {roundComposerOpen && (
        <FundingRoundComposer
          members={activeMembers}
          currency={currency}
          prefill={roundComposerPrefill}
          onSubmit={handleCreateRound}
          onClose={() => { setRoundComposerOpen(false); setRoundComposerPrefill(null); }}
        />
      )}

      {contributionDialog && (
        <ContributionActionDialog
          mode={contributionDialog.mode}
          round={contributionDialog.round}
          members={activeMembers}
          currentMember={currentMember}
          currency={currency}
          onSave={(payload) => handleContributionSave(contributionDialog.round, payload, contributionDialog.mode)}
          onClose={() => setContributionDialog(null)}
        />
      )}

      {reimbursementOpen && (
        <ReimbursementSection.Dialog
          candidates={fund.reimbursement_candidates}
          members={activeMembers}
          currency={currency}
          onSave={handleRecordReimbursement}
          onClose={() => setReimbursementOpen(false)}
        />
      )}

      {refundOpen && (
        <RefundDistributionModal
          available={fund.accounting.surplus}
          currency={currency}
          onPreview={handlePreviewRefund}
          onConfirm={handleRecordRefund}
          onClose={() => setRefundOpen(false)}
        />
      )}

      {closeConfirmOpen && (
        <ConfirmDialog
          title={t('fund.closeConfirmTitle')}
          body={t('fund.closeConfirmBody')}
          confirmLabel={t('fund.close')}
          destructive={false}
          onConfirm={handleCloseFund}
          onCancel={() => setCloseConfirmOpen(false)}
        />
      )}

      {detailsExpense && (
        // View-only from the Fund page (canEdit/canCreateExpense=false
        // correctly HIDES the Edit/Duplicate/Delete buttons entirely --
        // see ExpenseDetailsDrawer.jsx -- never a dead/broken button):
        // editing a Fund-paid expense's participants/payment source is a
        // full Expense Composer operation that belongs on the Expenses
        // Ledger, not partially reimplemented here.
        <ExpenseDetailsDrawer
          expense={detailsExpense}
          category={categoriesByCode[detailsExpense.category]}
          budget={budgets.find((row) => row.category === detailsExpense.category)}
          membersById={membersLookup}
          currency={currency}
          canEdit={false}
          canCreateExpense={false}
          onEdit={() => {}}
          onDuplicate={() => {}}
          onDelete={() => {}}
          onClose={() => setDetailsExpense(null)}
        />
      )}
    </div>
  );
}
