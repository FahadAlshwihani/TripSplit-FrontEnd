import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: 15000 });
api.interceptors.request.use((config) => {
  const csrf = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
  if (csrf) config.headers['X-CSRFToken'] = decodeURIComponent(csrf);
  return config;
});
const data = (request) => request.then((response) => response.data);
const guestKey = (tripId) => `tripsplit:guest:${tripId}`;
export const saveGuestToken = (tripId, token) => localStorage.setItem(guestKey(tripId), token);
export const getGuestToken = (tripId) => localStorage.getItem(guestKey(tripId));
const guestConfig = (tripId) => ({ headers: getGuestToken(tripId) ? { 'X-Guest-Token': getGuestToken(tripId) } : {} });

export const requestOtp = (email) => data(api.post('/auth/otp/request/', { email }));
export const verifyOtp = (payload) => data(api.post('/auth/otp/verify/', payload));
export const getCurrentUser = () => data(api.get('/auth/me/'));
export const logout = () => data(api.post('/auth/logout/'));
export const updateProfile = (payload) => data(api.patch('/profile/', payload));
export const requestEmailChange = (email) => data(api.post('/profile/email/change/request/', { email }));
export const verifyEmailChange = (payload) => data(api.post('/profile/email/change/verify/', payload));
export const createTrip = async (payload) => { const response = await data(api.post('/trips/', payload)); if (response.guest_token) saveGuestToken(response.trip.id, response.guest_token); return response; };
export const joinTrip = async (payload) => { const response = await data(api.post('/trips/join/', payload)); if (response.guest_token) saveGuestToken(response.trip.id, response.guest_token); return response; };
export const getTrips = () => data(api.get('/trips/'));
export const getTrip = (tripId) => data(api.get(`/trips/${tripId}/`, guestConfig(tripId)));
export const getMembers = (tripId) => data(api.get(`/trips/${tripId}/members/`, guestConfig(tripId)));
export const getExpenses = (tripId) => data(api.get(`/trips/${tripId}/expenses/`, guestConfig(tripId)));
export const addExpense = (tripId, payload) => data(api.post(`/trips/${tripId}/expenses/`, payload, guestConfig(tripId)));
export const deleteExpense = (tripId, expenseId) => data(api.delete(`/trips/${tripId}/expenses/${expenseId}/`, guestConfig(tripId)));
export const getCategoryBudgets = (tripId) => data(api.get(`/trips/${tripId}/category-budgets/`, guestConfig(tripId)));
export const getBalances = (tripId) => data(api.get(`/trips/${tripId}/balances/`, guestConfig(tripId)));
export default api;
