import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getActivity = (id, config) => responseData(apiClient.get(`/trips/${id}/activity/`, tripRequest(id, config)));
