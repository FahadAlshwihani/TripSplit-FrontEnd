import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getAccountTrips } from '../../trips/api/tripsApi';

// Changing the filter must reset previous page data cleanly (resetOnKeyChange)
// and cancel any stale in-flight request for the old filter -- both already
// guaranteed by useRouteResource, reused as-is rather than re-implemented here.
export default function useAccountTrips(filterValue) {
  const resource = useRouteResource(
    (signal) => getAccountTrips(filterValue, { signal }),
    [filterValue],
    true
  );

  const loadNextPage = () => {
    const nextUrl = resource.data?.next;
    if (!nextUrl || resource.loadingMore) return;
    const page = new URL(nextUrl).searchParams.get('page');
    resource.loadMore(
      (signal) => getAccountTrips(filterValue, { signal, params: { page } }),
      (current, nextPage) => ({ ...nextPage, results: [...(current?.results || []), ...nextPage.results] })
    );
  };

  return {
    trips: resource.data?.results || [],
    count: resource.data?.count ?? null,
    hasMore: Boolean(resource.data?.next),
    loading: resource.loading,
    loadingMore: resource.loadingMore,
    error: resource.error,
    retry: resource.retry,
    loadNextPage,
  };
}
