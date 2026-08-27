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
// Every distinct code IdleSessionMiddleware can return (apps/accounts/
// middleware.py) — session_expired (absolute cap), session_idle_timeout
// (the user's configured inactivity policy), session_revoked ("log out
// from all devices" used elsewhere). Handled identically here (force the
// user out) but the specific code is forwarded to AuthContext so the Sign
// In screen can show copy that matches what actually happened, instead of
// one generic "please sign in again" for every case.
const SESSION_EXPIRY_CODES = new Set(['session_expired', 'session_idle_timeout', 'session_revoked']);

apiClient.interceptors.response.use((response) => response, (error) => {
  const normalized = normalizeApiError(error);
  if (SESSION_EXPIRY_CODES.has(normalized.code)) emitSessionExpired(normalized.code);
  return Promise.reject(normalized);
});
export const responseData = (request) => request.then((response) => response.data);
