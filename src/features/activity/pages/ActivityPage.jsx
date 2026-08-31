import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ActivityToolbar from '../components/ActivityToolbar';
import ActivityPanel from '../components/ActivityPanel';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import EmptyState from '../../../shared/components/EmptyState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import useActivityFilters from '../hooks/useActivityFilters';
import { getActivity, getActivityPage } from '../api/activityApi';
import '../styles/activity.css';

export default function ActivityPage() {
  const { tripId } = useOutletContext();
  const { t } = useTranslation();
  const { filters, setFilters } = useActivityFilters();

  const resource = useRouteResource(
    (signal) => getActivity(tripId, { signal, filters }),
    [tripId, filters],
    true,
  );

  const loadMore = () => resource.loadMore(
    (signal) => getActivityPage(resource.data.next, tripId, { signal }),
    (current, page) => ({ ...page, results: [...current.results, ...page.results] }),
  );

  const events = resource.data?.results || [];

  return (
    <div className="act-page">
      <div className="act-page__header">
        <h1 className="act-page__title text-display">{t('activity.title')}</h1>
        <p className="act-page__subtitle text-copy-lg">{t('activity.subtitle')}</p>
      </div>

      <ActivityToolbar filters={filters} setFilters={setFilters} />

      {resource.error ? (
        <ErrorState message={resource.error.message} onRetry={resource.retry} />
      ) : resource.loading ? (
        <NeoLoading />
      ) : events.length ? (
        <>
          <ActivityPanel events={events} />
          {resource.data.next && (
            <div className="act-load-more">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={loadMore} disabled={resource.loadingMore}>
                {t('common.loadMore')}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState>{t('activity.empty')}</EmptyState>
      )}
    </div>
  );
}
