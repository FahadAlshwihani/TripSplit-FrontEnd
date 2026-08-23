import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';
import { normalizeApiError } from './errors';
import { emitSessionExpired } from '../auth/sessionEvents';

export const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: API_TIMEOUT });
apiClient.interceptors.request.use((config) => {
  const csrf = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
  if (csrf) config.headers['X-CSRFToken'] = decodeURIComponent(csrf);
  return config;
});
apiClient.interceptors.response.use((response) => response, (error) => {
  const normalized = normalizeApiError(error);
  // The backend's idle/absolute session-expiry middleware returns this
  // structured code on any request once a previously-authenticated session
  // has timed out — surfaced globally here so no feature has to implement
  // its own 401 handling (see AuthContext, which listens for this).
  if (normalized.code === 'session_expired') emitSessionExpired();
  return Promise.reject(normalized);
});
export const responseData = (request) => request.then((response) => response.data);
