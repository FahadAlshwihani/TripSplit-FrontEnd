import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useTripOverview from '../hooks/useTripOverview';
import OverviewSummaryCards from '../components/overview/OverviewSummaryCards';
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

  const { trip, summary, spending_split: split, category_ledger: categories, recent_activity: activity } = resource.data;

  return (
    <div className="ov-page">
      <div className="ov-page__header">
        <h1 className="ov-page__title text-display">{t('dashboard.overview.title')}</h1>
        <p className="ov-page__subtitle text-copy-lg">{t('dashboard.overview.subtitle', { tripName: trip.title })}</p>
      </div>

      <OverviewSummaryCards summary={summary} currency={trip.currency} />

      <div className="ov-page__mid">
        <CategoryLedger categories={categories} currency={trip.currency} tripId={tripId} />
        <SpendingSplit split={split} />
      </div>

      <RecentActivity events={activity} currency={trip.currency} tripId={tripId} />
    </div>
  );
}
