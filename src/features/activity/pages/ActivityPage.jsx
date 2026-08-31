import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ActivityPanel from '../components/ActivityPanel';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import EmptyState from '../../../shared/components/EmptyState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getActivity, getActivityPage } from '../api/activityApi';

export default function ActivityPage() {
  const { tripId } = useOutletContext();
  const { t } = useTranslation();
  const resource = useRouteResource(
    (signal) => getActivity(tripId, { signal }),
    [tripId],
  );

  if (resource.loading) return <NeoLoading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const events = resource.data?.results || [];
  if (!events.length) return <EmptyState>{t('activity.empty')}</EmptyState>;

  const loadMore = () => resource.loadMore(
    (signal) => getActivityPage(resource.data.next, tripId, { signal }),
    (current, page) => ({ ...page, results: [...current.results, ...page.results] }),
  );

  return (
    <>
      <ActivityPanel events={events} />
      {resource.data.next && <button onClick={loadMore}>{t('common.loadMore')}</button>}
    </>
  );
}
