import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getMembers } from '../../members/api/membersApi';
import { getSettlements, recordAdminSettlement, reviewSettlement } from '../api/settlementsApi';
import SettlementActionDialog from '../components/SettlementActionDialog';
import SettlementLedgerRow from '../components/SettlementLedgerRow';
import SettlementTimelineDrawer from '../components/SettlementTimelineDrawer';
import '../styles/settlements.css';

/*
  The canonical full settlement ledger/history -- who owed whom, how
  much, who reported/recorded/reviewed it, when. This is deliberately
  NOT the action-focused current-debt view (that's BalancesPage); this
  page never duplicates that UI, it's the historical record you click
  into for the full timeline. See docs/api/settlements.md.

  Status filtering is client-side over the loaded page (server-side
  filtering isn't offered by GET /settlements/ today) -- a trip with an
  unusually large settlement history may need "load more" before an
  older filtered row appears; documented as a known limitation.
*/
const FILTERS = [
  { value: 'all', key: 'all' },
  { value: 'pending', key: 'pending' },
  { value: 'confirmed', key: 'confirmed' },
  { value: 'rejected', key: 'needsAttention' },
  { value: 'cancelled', key: 'cancelled' },
];

export default function SettlementsPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const resource = useRouteResource(async (signal) => {
    const config = { signal };
    const [settlementPage, members] = await Promise.all([
      getSettlements(tripId, { ...config, params: { page_size: 100 } }),
      getMembers(tripId, config),
    ]);
    return { settlements: settlementPage.results, members: members.results };
  }, [tripId]);

  if (resource.loading) return <NeoLoading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const { settlements, members } = resource.data;
  const currency = trip.currency;
  const readOnly = !permissions.canRecordSettlement;
  const canRecordAdmin = !readOnly && ['owner', 'admin'].includes(currentMember?.role);
  const isManager = ['owner', 'admin'].includes(currentMember?.role);

  const rows = filter === 'all' ? settlements : settlements.filter((row) => row.status === filter);

  const runReview = async (settlement, decision) => {
    setBusyId(settlement.id);
    try {
      await reviewSettlement(tripId, settlement.id, decision);
      setActionError(null);
      await resource.retry();
    } catch (error) {
      setActionError(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminSave = async (payload) => {
    await recordAdminSettlement(tripId, payload);
    setAdminDialogOpen(false);
    setActionError(null);
    await resource.retry();
  };

  return (
    <div className="settle-page">
      <div className="settle-page__header">
        <h1 className="settle-page__title text-display">{t('settlements.title')}</h1>
        <p className="settle-page__subtitle text-copy-lg">{t('settlements.history')}</p>
      </div>

      {actionError && <ErrorState message={actionError.message} />}

      <div className="settle-page__toolbar">
        <SegmentedControl
          ariaLabel={t('settlements.title')}
          options={FILTERS.map((option) => ({ value: option.value, label: t(`settlements.filter.${option.key}`) }))}
          value={filter}
          onChange={setFilter}
        />
        {canRecordAdmin && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setAdminDialogOpen(true)}>
            <i className="bi bi-person-check" aria-hidden="true" /> {t('settlements.recordExternal')}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bal-empty">
          <i className="bi bi-receipt bal-empty__icon" aria-hidden="true" />
          <p className="bal-empty__body">{t('settlements.empty')}</p>
        </div>
      ) : (
        <div className="settle-ledger">
          {rows.map((settlement) => (
            <SettlementLedgerRow
              key={settlement.id}
              settlement={settlement}
              currency={currency}
              busy={busyId === settlement.id}
              canReview={!readOnly && settlement.status === 'pending' && (settlement.to_member_id === currentMember?.id || isManager)}
              canCancel={!readOnly && settlement.status === 'pending' && (settlement.created_by === currentMember?.id || isManager)}
              onOpen={setTimelineTarget}
              onConfirm={(row) => runReview(row, 'confirm')}
              onNotReceived={(row) => runReview(row, 'not-received')}
              onCheckLater={(row) => runReview(row, 'check-later')}
              onCancel={(row) => runReview(row, 'cancel')}
            />
          ))}
        </div>
      )}

      {timelineTarget && (
        <SettlementTimelineDrawer tripId={tripId} settlement={timelineTarget} currency={currency} onClose={() => setTimelineTarget(null)} />
      )}

      {adminDialogOpen && (
        <SettlementActionDialog
          mode="admin"
          members={members}
          currentMember={currentMember}
          currency={currency}
          onSave={handleAdminSave}
          onClose={() => setAdminDialogOpen(false)}
        />
      )}
    </div>
  );
}
