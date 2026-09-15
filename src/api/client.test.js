import { getGuestToken, joinRequestCredential, saveGuestToken, tripRequest } from './credentials';
import { ApiError, isRequestCancelled, normalizeApiError } from './errors';
import { apiClient } from './client';

afterEach(() => localStorage.clear());
test('scopes guest credentials to one trip request', () => { saveGuestToken('trip-a','secret'); expect(getGuestToken('trip-a')).toBe('secret'); expect(tripRequest('trip-a').headers).toEqual({'X-Guest-Token':'secret'}); expect(tripRequest('trip-b').headers).toEqual({}); });
test('injects join request credentials only when provided', () => { expect(joinRequestCredential('pending-secret').headers).toEqual({'X-Join-Request-Token':'pending-secret'}); expect(joinRequestCredential('').headers).toEqual({}); });
test('normalizes structured and network errors', () => { const structured=normalizeApiError({response:{status:403,data:{code:'trip_banned',message:'Access denied',fields:{expires_at:'later'}}}}); expect(structured).toBeInstanceOf(ApiError); expect(structured).toMatchObject({status:403,code:'trip_banned',message:'Access denied',fields:{expires_at:'later'}}); expect(normalizeApiError(new Error('offline')).code).toBe('network_error'); });
test('normalizes aborted reads without exposing Axios internals', () => { const normalized=normalizeApiError({name:'CanceledError',code:'ERR_CANCELED',message:'canceled'}); expect(normalized).toMatchObject({code:'request_cancelled',message:'Request cancelled.'}); expect(isRequestCancelled(normalized)).toBe(true); expect(isRequestCancelled({name:'AbortError'})).toBe(true); });

test('canonical transport includes credentials and reuses an exposed CSRF token', async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: requests.length === 1 ? { 'x-csrftoken': 'masked-response-token' } : {},
      config,
    };
  };

  try {
    await apiClient.get('/auth/me/');
    await apiClient.patch('/profile/', { display_name: 'Session User' });
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }

  expect(apiClient.defaults.withCredentials).toBe(true);
  expect(requests[1].headers.get('X-CSRFToken')).toBe('masked-response-token');
});
