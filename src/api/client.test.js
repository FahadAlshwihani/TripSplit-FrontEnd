import { getGuestToken, joinRequestCredential, saveGuestToken, tripRequest } from './credentials';
import { ApiError, normalizeApiError } from './errors';

afterEach(() => localStorage.clear());
test('scopes guest credentials to one trip request', () => { saveGuestToken('trip-a','secret'); expect(getGuestToken('trip-a')).toBe('secret'); expect(tripRequest('trip-a').headers).toEqual({'X-Guest-Token':'secret'}); expect(tripRequest('trip-b').headers).toEqual({}); });
test('injects join request credentials only when provided', () => { expect(joinRequestCredential('pending-secret').headers).toEqual({'X-Join-Request-Token':'pending-secret'}); expect(joinRequestCredential('').headers).toEqual({}); });
test('normalizes structured and network errors', () => { const structured=normalizeApiError({response:{status:403,data:{code:'trip_banned',message:'Access denied',fields:{expires_at:'later'}}}}); expect(structured).toBeInstanceOf(ApiError); expect(structured).toMatchObject({status:403,code:'trip_banned',message:'Access denied',fields:{expires_at:'later'}}); expect(normalizeApiError(new Error('offline')).code).toBe('network_error'); });
