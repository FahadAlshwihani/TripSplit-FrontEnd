import React from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import useModalDialog from '../../../shared/hooks/useModalDialog';
import NewExpenseDialog from '../../expenses/components/NewExpenseDialog';
import InviteMemberDialog from '../../governance/components/InviteMemberDialog';
import FundingRoundComposer from '../../funds/components/FundingRoundComposer';
import { addExpense } from '../../expenses/api/expensesApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { getMembers } from '../../members/api/membersApi';
import { getFund, createFundingRound } from '../../funds/api/fundsApi';
import { createInvitation } from '../../invitations/api/invitationsApi';
import { useQuickActionInvalidation } from './QuickActionRefreshContext';

const fulfilled = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);

const QuickActionLoadState = ({ error, onRetry, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useModalDialog(onClose);
  return (
    <ModalPortal>
      <div className="dash-quick-action-status-overlay" role="presentation" onClick={onClose}>
        <div ref={dialogRef} tabIndex="-1" className="dash-quick-action-status" role="dialog" aria-modal="true" aria-label={t('dashboard.quickActions')} onClick={(event) => event.stopPropagation()}>
          {error ? (
            <ErrorState title={t('dashboard.quickActionsLoadError')} message={error.message} onRetry={onRetry} />
          ) : (
            <SectionLoading minHeight={120} compact />
          )}
          <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </ModalPortal>
  );
};

function ExpenseQuickAction({ trip, tripId, currentMember, onClose }) {
  const invalidate = useQuickActionInvalidation();
  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const results = await Promise.allSettled([
      getMembers(tripId, config),
      getCategories(tripId, config),
      getCategoryBudgets(tripId, config),
      getFund(tripId, config),
    ]);
    const requiredFailure = results.slice(0, 3).find((result) => result.status === 'rejected');
    if (requiredFailure) throw requiredFailure.reason;
    return {
      members: fulfilled(results[0], { results: [] }).results.filter((member) => member.active),
      categories: fulfilled(results[1], { results: [] }).results,
      budgets: fulfilled(results[2], { results: [] }).results,
      fund: fulfilled(results[3], null),
    };
  }, [tripId], true);

  if (!resource.data) return <QuickActionLoadState error={resource.error} onRetry={resource.retry} onClose={onClose} />;

  return (
    <NewExpenseDialog
      members={resource.data.members}
      categories={resource.data.categories}
      budgets={resource.data.budgets}
      currentMember={currentMember}
      tripCurrency={trip.currency}
      fund={resource.data.fund}
      expense={null}
      onSubmit={async (payload) => {
        await addExpense(tripId, { ...payload, idempotency_key: crypto.randomUUID() });
        invalidate(['expenses', 'overview', 'fund']);
        onClose();
      }}
      onClose={onClose}
    />
  );
}

function MemberQuickAction({ tripId, onClose }) {
  const invalidate = useQuickActionInvalidation();
  return (
    <InviteMemberDialog
      onInvite={async (payload) => {
        const result = await createInvitation(tripId, payload);
        invalidate(['governance']);
        return result;
      }}
      onClose={onClose}
    />
  );
}

function FundingRoundQuickAction({ trip, tripId, onClose }) {
  const { t } = useTranslation();
  const invalidate = useQuickActionInvalidation();
  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [members, fund] = await Promise.all([getMembers(tripId, config), getFund(tripId, config)]);
    if (!fund || fund.status !== 'active') throw new Error(t('dashboard.quickActionsFundUnavailable'));
    return { members: members.results.filter((member) => member.active), fund };
  }, [tripId], true);

  if (!resource.data) return <QuickActionLoadState error={resource.error} onRetry={resource.retry} onClose={onClose} />;

  return (
    <FundingRoundComposer
      members={resource.data.members}
      currency={trip.currency}
      onSubmit={async (payload) => {
        await createFundingRound(tripId, payload);
        invalidate(['fund', 'overview']);
        onClose();
      }}
      onClose={onClose}
    />
  );
}

export default function QuickActionDialogs({ action, trip, tripId, currentMember, onClose }) {
  if (!action || action.type === 'menu') return null;
  if (action.type === 'expense') return <ExpenseQuickAction trip={trip} tripId={tripId} currentMember={currentMember} onClose={onClose} />;
  if (action.type === 'member') return <MemberQuickAction tripId={tripId} onClose={onClose} />;
  if (action.type === 'funding-round') return <FundingRoundQuickAction trip={trip} tripId={tripId} onClose={onClose} />;
  return null;
}
