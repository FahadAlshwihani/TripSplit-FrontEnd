import { apiClient, responseData } from '../../../api/client';
import { guestDeviceRequest, saveGuestDeviceToken, saveGuestToken, tripRequest } from '../../../api/credentials';
import { recordGuestTrip } from '../../../shared/guestTripsStore';
// Both send the durable device credential (if this browser already has
// one) so the backend can recognize a returning guest and resume an
// existing membership instead of creating a new one -- see
// docs/architecture/guest-identity.md. guest_device_token in the response
// is only ever present when a NEW device identity was minted this call.
// Guest tokens are saved under BOTH the trip's UUID (id) and its
// short_code -- a guest may later land on either URL form (their own
// bookmark keeps using whichever was current when they created/joined;
// a freshly shared link uses short_code -- see TripLayout's own
// mirroring for the reverse case, an existing guest returning via a
// form their token wasn't originally saved under).
export const createTrip = async (payload) => { const response = await responseData(apiClient.post('/trips/', payload, guestDeviceRequest())); if (response.guest_token) { saveGuestToken(response.trip.id, response.guest_token); if (response.trip.short_code) saveGuestToken(response.trip.short_code, response.guest_token); recordGuestTrip({ tripId: response.trip.id, title: response.trip.title, relationship: 'owner' }); } if (response.guest_device_token) saveGuestDeviceToken(response.guest_device_token); return response; };
export const joinTrip = async (payload) => { const response = await responseData(apiClient.post('/trips/join/', payload, guestDeviceRequest())); if (response.guest_token && response.trip) { saveGuestToken(response.trip.id, response.guest_token); if (response.trip.short_code) saveGuestToken(response.trip.short_code, response.guest_token); recordGuestTrip({ tripId: response.trip.id, title: response.trip.title, relationship: 'member' }); } if (response.guest_device_token) saveGuestDeviceToken(response.guest_device_token); return response; };
export const getTrips = () => responseData(apiClient.get('/trips/'));
// The Account hub's Your Trips list -- a superset of getTrips() that also
// includes left/removed memberships, with role/capability data, filtered
// and paginated server-side. See apps.trips.views.trips_view's ?scope=account
// branch and apps.trips.selectors.account_trip_history_for_user().
export const getAccountTrips = (filterValue, config) => responseData(apiClient.get('/trips/', { ...config, params: { scope: 'account', filter: filterValue, ...(config?.params || {}) } }));
export const leaveTrip = (id) => responseData(apiClient.post(`/trips/${id}/leave/`, {}, tripRequest(id)));
// The one endpoint TripLayout bootstraps a route through -- also sends
// the durable guest-device credential (if this browser has one) so a
// guest who already has a membership in this trip is recognized even
// when the per-trip guest token wasn't saved under THIS particular
// URL-identifier form (a freshly shared short_code link for a trip
// they joined under the UUID form, or vice versa) or was simply lost.
// The backend only ever includes `guest_token` in the response when
// that recovery path actually ran (apps.trips.views.trip_detail_view) --
// save it under both identifier forms so every subsequent request (all
// of which use the plain per-trip token, never the device token) finds
// it, exactly like createTrip/joinTrip's own token-saving above.
export const getTrip = async (id, config) => {
  const response = await responseData(apiClient.get(`/trips/${id}/`, guestDeviceRequest(tripRequest(id, config))));
  if (response.guest_token) {
    saveGuestToken(response.id, response.guest_token);
    if (response.short_code) saveGuestToken(response.short_code, response.guest_token);
  }
  return response;
};
export const updateTrip = (id, payload) => responseData(apiClient.patch(`/trips/${id}/`, payload, tripRequest(id)));
export const rotateJoinCode = (id) => responseData(apiClient.post(`/trips/${id}/rotate-join-code/`, {}, tripRequest(id)));
export const archiveTrip = (id) => responseData(apiClient.delete(`/trips/${id}/`, tripRequest(id)));
export const restoreTrip = (id) => responseData(apiClient.post(`/trips/${id}/restore/`, {}, tripRequest(id)));
export const closeTrip = (id) => responseData(apiClient.post(`/trips/${id}/close/`, {}, tripRequest(id)));
export const reopenTrip = (id) => responseData(apiClient.post(`/trips/${id}/reopen/`, {}, tripRequest(id)));
export const getTripSummary = (id, config) => responseData(apiClient.get(`/trips/${id}/summary/`, tripRequest(id, config)));
export const getTripOverview = (id, config) => responseData(apiClient.get(`/trips/${id}/overview/`, tripRequest(id, config)));
