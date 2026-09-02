import { apiClient, responseData } from '../../../api/client';
import { tripRequest } from '../../../api/credentials';

// A guest requester's membership is verified server-side via the same
// X-Guest-Token every other trip-scoped mutation already sends (see
// require_membership on the backend) -- tripRequest(tripId) attaches it
// automatically when one exists for this trip, no different than any
// other trip-scoped API call. Without a tripId, no guest header is sent
// (matches the backend: no trip means no guest concept, only a signed-in
// account may submit).
export const createSupportTicket = (tripId, payload) => responseData(
  apiClient.post('/support/tickets/', payload, tripId ? tripRequest(tripId) : {}),
);
