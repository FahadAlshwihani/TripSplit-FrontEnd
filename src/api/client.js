import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';
import { normalizeApiError } from './errors';

export const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: API_TIMEOUT });
apiClient.interceptors.request.use((config) => {
  const csrf = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
  if (csrf) config.headers['X-CSRFToken'] = decodeURIComponent(csrf);
  return config;
});
apiClient.interceptors.response.use((response) => response, (error) => Promise.reject(normalizeApiError(error)));
export const responseData = (request) => request.then((response) => response.data);
