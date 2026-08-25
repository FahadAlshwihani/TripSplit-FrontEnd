import { apiClient, responseData } from '../../../api/client';
import { saveGuestToken, tripRequest } from '../../../api/credentials';
import { recordGuestTrip } from '../../../shared/guestTripsStore';
export const createTrip = async (payload) => { const response = await responseData(apiClient.post('/trips/', payload)); if (response.guest_token) { saveGuestToken(response.trip.id, response.guest_token); recordGuestTrip({ tripId: response.trip.id, title: response.trip.title, relationship: 'owner' }); } return response; };
export const joinTrip = async (payload) => { const response = await responseData(apiClient.post('/trips/join/', payload)); if (response.guest_token && response.trip) { saveGuestToken(response.trip.id, response.guest_token); recordGuestTrip({ tripId: response.trip.id, title: response.trip.title, relationship: 'member' }); } return response; };
export const getTrips = () => responseData(apiClient.get('/trips/'));
// The Account hub's Your Trips list -- a superset of getTrips() that also
// includes left/removed memberships, with role/capability data, filtered
// and paginated server-side. See apps.trips.views.trips_view's ?scope=account
// branch and apps.trips.selectors.account_trip_history_for_user().
export const getAccountTrips = (filterValue, config) => responseData(apiClient.get('/trips/', { ...config, params: { scope: 'account', filter: filterValue, ...(config?.params || {}) } }));
export const leaveTrip = (id) => responseData(apiClient.post(`/trips/${id}/leave/`, {}, tripRequest(id)));
export const getTrip = (id, config) => responseData(apiClient.get(`/trips/${id}/`, tripRequest(id, config)));
export const updateTrip = (id, payload) => responseData(apiClient.patch(`/trips/${id}/`, payload, tripRequest(id)));
export const archiveTrip = (id) => responseData(apiClient.delete(`/trips/${id}/`, tripRequest(id)));
export const restoreTrip = (id) => responseData(apiClient.post(`/trips/${id}/restore/`, {}, tripRequest(id)));
export const closeTrip = (id) => responseData(apiClient.post(`/trips/${id}/close/`, {}, tripRequest(id)));
export const reopenTrip = (id) => responseData(apiClient.post(`/trips/${id}/reopen/`, {}, tripRequest(id)));
export const getTripSummary = (id, config) => responseData(apiClient.get(`/trips/${id}/summary/`, tripRequest(id, config)));
export const getTripOverview = (id, config) => responseData(apiClient.get(`/trips/${id}/overview/`, tripRequest(id, config)));
