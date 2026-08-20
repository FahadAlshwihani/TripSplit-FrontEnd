import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Balances from '../../balances/components/Balances';
import SettlementsPanel from '../components/SettlementsPanel';
import Loading from '../../../components/Loading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getBalances } from '../../balances/api/balancesApi';
import { getMembers } from '../../members/api/membersApi';
import {
  addSettlement, deleteSettlement, getSettlementPage, getSettlements,
  reviewSettlement, updateSettlement,
} from '../api/settlementsApi';

export default function SettlementsPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [actionError, setActionError] = useState(null);
  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [balances, settlements, members] = await Promise.all([
      getBalances(tripId, config),
      getSettlements(tripId, config),
      getMembers(tripId, config),
    ]);
    return { balances, settlements, members: members.results };
  }, [tripId]);

  const run = async (action) => {
    try { await action(); await resource.retry(); } catch (error) { setActionError(error); }
  };
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const loadMore = () => resource.loadMore(
    (signal) => getSettlementPage(resource.data.settlements.next, tripId, { signal }),
    (current, page) => ({
      ...current,
      settlements: { ...page, results: [...current.settlements.results, ...page.results] },
    }),
  );

  return (
    <>
      {actionError && <ErrorState message={actionError.message} />}
      <Balances data={resource.data.balances} />
      <SettlementsPanel
        members={resource.data.members}
        currency={trip.currency}
        settlements={resource.data.settlements.results}
        suggestion={resource.data.balances.suggested_settlements?.[0]}
        currentMember={currentMember}
        pendingCount={trip.pending_settlement_confirmations}
        disabled={!permissions.canRecordSettlement}
        onSave={(payload, id) => run(() => id
          ? updateSettlement(tripId, id, payload)
          : addSettlement(tripId, payload))}
        onDelete={(settlement) => run(() => deleteSettlement(tripId, settlement.id))}
        onReview={(settlement, decision) => run(() => reviewSettlement(tripId, settlement.id, decision))}
      />
      {resource.data.settlements.next && <button onClick={loadMore}>{t('common.loadMore')}</button>}
    </>
  );
}
