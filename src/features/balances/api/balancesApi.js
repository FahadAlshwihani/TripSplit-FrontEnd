import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getBalances = (id, config) => responseData(apiClient.get(`/trips/${id}/balances/`, tripRequest(id, config)));
