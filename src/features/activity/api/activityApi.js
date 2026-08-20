import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getActivity = (id, config) => responseData(apiClient.get(`/trips/${id}/activity/`, tripRequest(id, config)));
export const getActivityPage = (url,id,config) => responseData(apiClient.get(url,tripRequest(id,config)));
