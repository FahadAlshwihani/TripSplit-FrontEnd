import { getTrip } from './tripsApi';
import { getGuestDeviceToken, getGuestToken, saveGuestDeviceToken, saveGuestToken } from '../../../api/credentials';

jest.mock('../../../api/client', () => ({
  apiClient: { get: jest.fn() },
  responseData: (request) => request.then((response) => response.data),
}));

// eslint-disable-next-line import/first
import { apiClient } from '../../../api/client';

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('getTrip always sends the durable device credential alongside whatever per-trip guest token it finds', async () => {
  saveGuestDeviceToken('device-token-1');
  saveGuestToken('t1', 'per-trip-token-1');
  apiClient.get.mockResolvedValue({ data: { id: 't1', short_code: 's1' } });
  await getTrip('t1');
  const [, config] = apiClient.get.mock.calls[0];
  expect(config.headers['X-Guest-Device-Token']).toBe('device-token-1');
  expect(config.headers['X-Guest-Token']).toBe('per-trip-token-1');
});

test('getTrip still sends the device credential even when no per-trip guest token exists yet for this URL form', async () => {
  saveGuestDeviceToken('device-token-1');
  apiClient.get.mockResolvedValue({ data: { id: 'uuid-1', short_code: 'short-1' } });
  await getTrip('short-1');
  const [, config] = apiClient.get.mock.calls[0];
  expect(config.headers['X-Guest-Device-Token']).toBe('device-token-1');
  expect(config.headers['X-Guest-Token']).toBeUndefined();
});

test('a recovered guest_token in the response is saved under both the UUID id and the short_code', async () => {
  saveGuestDeviceToken('device-token-1');
  apiClient.get.mockResolvedValue({ data: { id: 'uuid-1', short_code: 'short-1', guest_token: 'fresh-token-1' } });
  await getTrip('short-1');
  expect(getGuestToken('uuid-1')).toBe('fresh-token-1');
  expect(getGuestToken('short-1')).toBe('fresh-token-1');
});

test('an ordinary response with no guest_token never writes anything to guest token storage', async () => {
  apiClient.get.mockResolvedValue({ data: { id: 'uuid-1', short_code: 'short-1' } });
  await getTrip('short-1');
  expect(getGuestToken('uuid-1')).toBeNull();
  expect(getGuestToken('short-1')).toBeNull();
});

test('getTrip works with no device token at all (registered user / brand new browser) -- no error, no header', async () => {
  apiClient.get.mockResolvedValue({ data: { id: 't1', short_code: 's1' } });
  await getTrip('t1');
  const [, config] = apiClient.get.mock.calls[0];
  expect(config.headers['X-Guest-Device-Token']).toBeUndefined();
  expect(getGuestDeviceToken()).toBeNull();
});

test('the abort signal passed through config is preserved alongside the added headers', async () => {
  const controller = new AbortController();
  apiClient.get.mockResolvedValue({ data: { id: 't1', short_code: 's1' } });
  await getTrip('t1', { signal: controller.signal });
  const [, config] = apiClient.get.mock.calls[0];
  expect(config.signal).toBe(controller.signal);
});
