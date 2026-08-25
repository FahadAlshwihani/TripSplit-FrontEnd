import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getTripOverview } from '../api/tripsApi';

// Thin wrapper around the shared route-resource fetch pattern (cancels
// stale requests on trip change/unmount, ignores out-of-order responses)
// -- one purpose-built payload per GET, not several list downloads
// stitched together client-side.
const useTripOverview = (tripId) => useRouteResource((signal) => getTripOverview(tripId, { signal }), tripId);

export default useTripOverview;
