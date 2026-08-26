import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getBalances, remindAllDebtors, remindDebtor } from '../api/balancesApi';
import { getMembers } from '../../members/api/membersApi';
import { getSettlements, recordAdminSettlement, recordReceivedPayment, reportPayment, reviewSettlement } from '../../settlements/api/settlementsApi';
import SettlementActionDialog from '../../settlements/components/SettlementActionDialog';
import NetBalanceCard from '../components/NetBalanceCard';
import BalanceMemberRow from '../components/BalanceMemberRow';
import '../styles/balances.css';
import '../../settlements/styles/settlements.css';

/*
  Two separate ledgers: this page shows PERSONAL balances (personal
  expense payments/shares + settlements) -- never Trip Fund contribution
  state. See docs/architecture/financial-ledger.md. All amounts here
  come straight from GET /balances/'s actor-perspective fields
  (my_net_balance, people_who_owe_me, people_i_owe) -- nothing is
  recomputed client-side.

  Product Rule 0: a debtor's own "I paid" report never moves balances by
  itself. This page surfaces that directly -- a member owed money to
  the current user sees Send Reminder / Record Payment Received; a
  member the current user owes sees "I Paid"; and once either side has
  reported a payment for a pair, both see a compact pending-settlement
  card with the real confirm/not-received/check-later/withdraw actions
  instead of the normal buttons, until it's resolved.
*/
export default function BalancesPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const readOnly = !permissions.canRecordSettlement;
  const canRecordAdmin = !readOnly && ['owner', 'admin'].includes(currentMember?.role);

  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [balances, members, settlementPage] = await Promise.all([
      getBalances(tripId, config),
      getMembers(tripId, config),
      // Only the first page (max 100) of settlements is scanned for
      // pending rows involving the current member -- a trip with more
      // than 100 settlements outstanding at once is not a case this
      // page optimizes for; the dedicated Settlements ledger page has
      // no such limit.
      getSettlements(tripId, { ...config, params: { page_size: 100 } }),
    ]);
    return { balances, members: members.results, settlements: settlementPage.results };
  }, [tripId]);

  const [actionError, setActionError] = useState(null);
  const [reminderStates, setReminderStates] = useState({}); // member_id -> { status, message }
  const [remindAllOpen, setRemindAllOpen] = useState(false);
  const [remindAllSending, setRemindAllSending] = useState(false);
  const [remindAllResult, setRemindAllResult] = useState(null);
  const [pendingStates, setPendingStates] = useState({}); // settlement_id -> { status, action }
  const [actionDialog, setActionDialog] = useState(null); // { mode, counterpart?, debt? } | null

  if (resource.loading) return <NeoLoading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const { balances, members, settlements } = resource.data;
  const currency = balances.currency || trip.currency;

  const setReminderState = (memberId, state) => {
    setReminderStates((current) => ({ ...current, [memberId]: state }));
  };

  const handleRemind = async (memberId) => {
    setReminderState(memberId, { status: 'sending' });
    try {
      await remindDebtor(tripId, memberId);
      setReminderState(memberId, { status: 'sent' });
      window.setTimeout(() => setReminderState(memberId, null), 6000);
      resource.retry();
    } catch (error) {
      if (error.code === 'reminder_cooldown') {
        setReminderState(memberId, { status: 'cooldown' });
      } else {
        setReminderState(memberId, { status: 'error', message: error.message });
        window.setTimeout(() => setReminderState(memberId, null), 6000);
      }
    }
  };

  const handleRemindAll = async () => {
    setRemindAllSending(true);
    try {
      const result = await remindAllDebtors(tripId);
      setRemindAllResult(result);
      setRemindAllOpen(false);
      resource.retry();
    } catch (error) {
      setActionError(error);
      setRemindAllOpen(false);
    } finally {
      setRemindAllSending(false);
    }
  };

  const pendingFor = (fromId, toId) => settlements.find((row) => row.status === 'pending' && row.from_member_id === fromId && row.to_member_id === toId);

  const runPendingAction = async (settlement, action, decision) => {
    setPendingStates((current) => ({ ...current, [settlement.id]: { status: 'sending', action } }));
    try {
      await reviewSettlement(tripId, settlement.id, decision);
      setActionError(null);
      setPendingStates((current) => ({ ...current, [settlement.id]: null }));
      await resource.retry();
    } catch (error) {
      setPendingStates((current) => ({ ...current, [settlement.id]: null }));
      setActionError(error);
    }
  };

  const openIPaid = (member, debt) => setActionDialog({ mode: 'report', counterpart: member, debt });
  const openRecordReceived = (member, debt) => setActionDialog({ mode: 'received', counterpart: member, debt });
  const openAdminRecord = () => setActionDialog({ mode: 'admin' });

  const handleDialogSave = async (payload) => {
    if (actionDialog.mode === 'report') await reportPayment(tripId, payload);
    else if (actionDialog.mode === 'received') await recordReceivedPayment(tripId, payload);
    else await recordAdminSettlement(tripId, payload);
    setActionDialog(null);
    setActionError(null);
    await resource.retry();
  };

  const peopleWhoOweMe = balances.people_who_owe_me || [];
  const peopleIOwe = balances.people_i_owe || [];
  const isSettled = peopleWhoOweMe.length === 0 && peopleIOwe.length === 0;
  const otherActiveMembers = members.filter((member) => member.active && member.id !== currentMember?.id).length;
  const noOneToSettleWith = isSettled && otherActiveMembers === 0;

  return (
    <div className="bal-page">
      <div className="bal-page__header">
        <h1 className="bal-page__title text-display">{t('balances.title')}</h1>
        <p className="bal-page__subtitle text-copy-lg">{t('balances.subtitle')}</p>
      </div>

      <p className="bal-fund-hint"><i className="bi bi-info-circle" aria-hidden="true" />{t('balances.fundHint')}</p>

      {readOnly && (
        <p className="bal-readonly-banner"><i className="bi bi-lock" aria-hidden="true" />{t('balances.readOnlyArchived')}</p>
      )}

      {actionError && <ErrorState message={actionError.message} />}

      <NetBalanceCard balance={balances.my_net_balance} currency={currency} />

      <div className="bal-page__actions">
        {!readOnly && !isSettled && peopleWhoOweMe.length > 0 && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setRemindAllOpen(true)}>
            <i className="bi bi-bell" aria-hidden="true" /> {t('balances.remindAll')}
          </button>
        )}
        {canRecordAdmin && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={openAdminRecord}>
            <i className="bi bi-person-check" aria-hidden="true" /> {t('settlements.recordExternal')}
          </button>
        )}
      </div>

      {remindAllResult && (
        <p className="bal-remind-result" role="status" aria-live="polite">
          <i className="bi bi-check-circle" aria-hidden="true" />
          {remindAllResult.sent_count > 0
            ? t('balances.remindAllResult', { sent: remindAllResult.sent_count, skipped: remindAllResult.skipped_count })
            : t('balances.remindAllResult_zero')}
        </p>
      )}

      {noOneToSettleWith ? (
        <div className="bal-empty">
          <i className="bi bi-people bal-empty__icon" aria-hidden="true" />
          <h2 className="bal-empty__title text-headline-sm">{t('balances.emptyStateTitle')}</h2>
          <p className="bal-empty__body">{t('balances.emptyStateBody')}</p>
        </div>
      ) : isSettled ? (
        <div className="bal-empty">
          <i className="bi bi-check-circle bal-empty__icon" aria-hidden="true" />
          <h2 className="bal-empty__title text-headline-sm">{t('balances.allSettledUp')}</h2>
          <p className="bal-empty__body">{t('balances.allSettledUpHint')}</p>
        </div>
      ) : (
        <>
          {peopleWhoOweMe.length > 0 && (
            <section className="bal-section">
              <div className="bal-section__head">
                <h2 className="bal-section__title text-headline-sm"><i className="bi bi-arrow-down-circle bal-section__icon" aria-hidden="true" />{t('balances.peopleWhoOweMe')}</h2>
              </div>
              <div className="bal-list">
                {peopleWhoOweMe.map((row) => {
                  const pending = pendingFor(row.member.member_id, currentMember.id);
                  return (
                    <BalanceMemberRow
                      key={row.member.member_id}
                      member={row.member}
                      amount={row.amount}
                      currency={currency}
                      direction="owes_me"
                      reminderState={reminderStates[row.member.member_id]}
                      canRemind={row.can_remind}
                      onRemind={handleRemind}
                      onRecordReceived={(member) => openRecordReceived(member, row.amount)}
                      pendingSettlement={pending}
                      pendingActionState={pending ? pendingStates[pending.id] : null}
                      onConfirmPending={() => runPendingAction(pending, 'confirm', 'confirm')}
                      onNotReceivedPending={() => runPendingAction(pending, 'not-received', 'not-received')}
                      onCheckLaterPending={() => runPendingAction(pending, 'check-later', 'check-later')}
                      readOnly={readOnly}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {peopleIOwe.length > 0 && (
            <section className="bal-section">
              <div className="bal-section__head">
                <h2 className="bal-section__title text-headline-sm"><i className="bi bi-arrow-up-circle bal-section__icon" aria-hidden="true" />{t('balances.peopleIOwe')}</h2>
              </div>
              <div className="bal-list">
                {peopleIOwe.map((row) => {
                  const pending = pendingFor(currentMember.id, row.member.member_id);
                  return (
                    <BalanceMemberRow
                      key={row.member.member_id}
                      member={row.member}
                      amount={row.amount}
                      currency={currency}
                      direction="i_owe"
                      onIPaid={(member) => openIPaid(member, row.amount)}
                      pendingSettlement={pending}
                      pendingActionState={pending ? pendingStates[pending.id] : null}
                      onCancelPending={() => runPendingAction(pending, 'cancel', 'cancel')}
                      readOnly={readOnly}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {remindAllOpen && (
        <ConfirmDialog
          title={t('balances.remindAllConfirmTitle')}
          body={t('balances.remindAllConfirmBody')}
          confirmLabel={t('balances.remindAllConfirmConfirm')}
          cancelLabel={t('balances.remindAllConfirmCancel')}
          destructive={false}
          onConfirm={handleRemindAll}
          onCancel={() => !remindAllSending && setRemindAllOpen(false)}
        />
      )}

      {actionDialog && (
        <SettlementActionDialog
          mode={actionDialog.mode}
          members={members}
          currentMember={currentMember}
          currency={currency}
          counterpart={actionDialog.counterpart}
          debt={actionDialog.debt}
          onSave={handleDialogSave}
          onClose={() => setActionDialog(null)}
        />
      )}
    </div>
  );
}
