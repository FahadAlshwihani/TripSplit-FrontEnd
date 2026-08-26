import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getBalances = (id, config) => responseData(apiClient.get(`/trips/${id}/balances/`, tripRequest(id, config)));
export const remindDebtor = (id, memberId) => responseData(apiClient.post(`/trips/${id}/balances/remind/${memberId}/`, {}, tripRequest(id)));
export const remindAllDebtors = (id) => responseData(apiClient.post(`/trips/${id}/balances/remind-all/`, {}, tripRequest(id)));
