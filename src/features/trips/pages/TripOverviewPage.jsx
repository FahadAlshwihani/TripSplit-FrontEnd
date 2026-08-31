import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useTripOverview from '../hooks/useTripOverview';
import OverviewSummaryCards from '../components/overview/OverviewSummaryCards';
import FundSnapshot from '../components/overview/FundSnapshot';
import CategoryLedger from '../components/overview/CategoryLedger';
import SpendingSplit from '../components/overview/SpendingSplit';
import RecentActivity from '../components/overview/RecentActivity';
import '../styles/overview.css';

export default function TripOverviewPage() {
  const { tripId } = useOutletContext();
  const { t } = useTranslation();
  const resource = useTripOverview(tripId);

  if (resource.loading) return <NeoLoading />;
  if (resource.error || !resource.data) {
    return <ErrorState title={t('dashboard.overview.errorLoad')} onRetry={resource.retry} />;
  }

  const { trip, summary, spending_split: split, category_ledger: categories, fund, funding_rounds_summary: roundsSummary, recent_activity: activity } = resource.data;

  return (
    <div className="ov-page">
      <div className="ov-page__header">
        <div className="ov-page__header-text">
          <h1 className="ov-page__title text-display">{t('dashboard.overview.title')}</h1>
          <p className="ov-page__subtitle text-copy-lg">{t('dashboard.overview.subtitle', { tripName: trip.title })}</p>
        </div>
        <div className="ov-page__utilities">
          {/* Real, non-destructive filter capability doesn't exist yet for
              Overview -- rendered disabled rather than wired to a fake
              action, per "don't ship a control that pretends to work". */}
          <button type="button" className="ov-utility-btn" disabled aria-label={t('dashboard.overview.filter')} title={t('dashboard.overview.filterUnavailable')}>
            <i className="bi bi-funnel" aria-hidden="true" />
          </button>
          <button type="button" className="ov-utility-btn" onClick={resource.retry} aria-label={t('dashboard.overview.refresh')}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
        </div>
      </div>

      <OverviewSummaryCards summary={summary} fund={fund} currency={trip.currency} />

      <FundSnapshot fund={fund} roundsSummary={roundsSummary} currency={trip.currency} tripId={tripId} />

      <div className="ov-page__mid">
        <CategoryLedger categories={categories} currency={trip.currency} tripId={tripId} totalAllocated={summary.total_allocated} unallocated={summary.unallocated} />
        <SpendingSplit split={split} />
      </div>

      <RecentActivity events={activity} currency={trip.currency} tripId={tripId} />
    </div>
  );
}
