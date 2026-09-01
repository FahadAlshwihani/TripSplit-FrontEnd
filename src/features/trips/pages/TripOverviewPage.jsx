import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useTripOverview from '../hooks/useTripOverview';
import OverviewSummaryCards from '../components/overview/OverviewSummaryCards';
import FundSnapshot from '../components/overview/FundSnapshot';
import CategoryLedger from '../components/overview/CategoryLedger';
import SpendingSplit from '../components/overview/SpendingSplit';
import RecentActivity from '../components/overview/RecentActivity';
import '../styles/overview.css';

/*
  The title/subtitle come from the outlet-context trip (TripLayout's
  own already-loaded fetch) -- never from this page's own overview
  fetch -- so the header renders on the very first paint, before this
  page's network request even resolves. Everything below the header
  (summary cards, Fund snapshot, category ledger, recent activity) is
  ONE combined payload from a single purpose-built endpoint (see
  useTripOverview's own comment: one GET, not several stitched-together
  list downloads) -- there's no independent per-card fetch to split
  loading across, so the data body loads/errors as one region while the
  header and page chrome stay put throughout. Once loaded, `resource.data`
  stays populated through any later background refetch (useRouteResource's
  own default), so the real content never gets replaced by a loading
  placeholder again -- only the very first load ever shows one.
*/
export default function TripOverviewPage() {
  const { trip: contextTrip, tripId } = useOutletContext();
  const { t } = useTranslation();
  const resource = useTripOverview(tripId);
  const data = resource.data;

  return (
    <div className="ov-page">
      <div className="ov-page__header">
        <div className="ov-page__header-text">
          <h1 className="ov-page__title text-display">{t('dashboard.overview.title')}</h1>
          <p className="ov-page__subtitle text-copy-lg">{t('dashboard.overview.subtitle', { tripName: contextTrip.title })}</p>
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

      {!data && resource.loading && <SectionLoading minHeight={320} />}
      {!data && resource.error && <ErrorState title={t('dashboard.overview.errorLoad')} message={resource.error.message} onRetry={resource.retry} />}

      {data && (() => {
        const { summary, spending_split: split, category_ledger: categories, fund, funding_rounds_summary: roundsSummary, recent_activity: activity } = data;
        return (
          <>
            <OverviewSummaryCards summary={summary} fund={fund} currency={contextTrip.currency} />
            <FundSnapshot fund={fund} roundsSummary={roundsSummary} currency={contextTrip.currency} />
            <div className="ov-page__mid">
              <CategoryLedger categories={categories} currency={contextTrip.currency} totalAllocated={summary.total_allocated} unallocated={summary.unallocated} />
              <SpendingSplit split={split} />
            </div>
            <RecentActivity events={activity} currency={contextTrip.currency} />
          </>
        );
      })()}
    </div>
  );
}
