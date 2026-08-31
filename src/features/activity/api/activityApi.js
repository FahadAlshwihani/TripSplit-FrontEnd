import { apiClient, responseData } from '../../../api/client';
import { tripRequest } from '../../../api/credentials';
import { familyEventTypes } from '../utils/eventRegistry';

// Translates the page's own {search, family} filter shape into the
// query params apps/trips/views.py:activity_view actually understands
// (`search`, `event_type` as a comma-separated list) -- the backend has
// no concept of "family", it only knows individual event_type values,
// so the family->event_type expansion happens here, once, using the
// same registry the icons/copy already key off of.
const toApiParams = (filters = {}) => {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.family) params.event_type = familyEventTypes(filters.family).join(',');
  return params;
};

export const getActivity = (id, { filters, ...config } = {}) => responseData(
  apiClient.get(`/trips/${id}/activity/`, tripRequest(id, { ...config, params: toApiParams(filters) })),
);
export const getActivityPage = (url, id, config) => responseData(apiClient.get(url, tripRequest(id, config)));
