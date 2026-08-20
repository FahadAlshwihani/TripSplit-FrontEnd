import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getExpenses = (id, config) => responseData(apiClient.get(`/trips/${id}/expenses/`, tripRequest(id, config)));
export const getPage = (url, id, config) => responseData(apiClient.get(url, tripRequest(id, config)));
export const addExpense = (id, payload) => responseData(apiClient.post(`/trips/${id}/expenses/`, payload, tripRequest(id)));
export const updateExpense = (id, expenseId, payload) => responseData(apiClient.patch(`/trips/${id}/expenses/${expenseId}/`, payload, tripRequest(id)));
export const deleteExpense = (id, expenseId) => responseData(apiClient.delete(`/trips/${id}/expenses/${expenseId}/`, tripRequest(id)));
