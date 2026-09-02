import { createSupportTicket } from './supportApi';
import { saveGuestToken } from '../../../api/credentials';

jest.mock('../../../api/client', () => ({
  apiClient: { post: jest.fn() },
  responseData: (request) => request.then((response) => response.data),
}));

// eslint-disable-next-line import/first
import { apiClient } from '../../../api/client';

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('posts to the canonical support ticket endpoint', async () => {
  apiClient.post.mockResolvedValue({ data: { reference: 'TS-2026-000001', status: 'new', created_at: '2026-08-30T00:00:00Z' } });
  const payload = { trip: 't1', phone_country_code: '+966', phone_number: '501234567', subject_type: 'inquiry', message: 'A message.' };
  await createSupportTicket('t1', payload);
  expect(apiClient.post).toHaveBeenCalledWith('/support/tickets/', payload, expect.any(Object));
});

test('attaches the per-trip guest token when one exists for the given trip', async () => {
  saveGuestToken('t1', 'guest-token-1');
  apiClient.post.mockResolvedValue({ data: {} });
  await createSupportTicket('t1', {});
  expect(apiClient.post.mock.calls[0][2].headers['X-Guest-Token']).toBe('guest-token-1');
});

test('sends no guest header when there is no tripId (account-level submission)', async () => {
  apiClient.post.mockResolvedValue({ data: {} });
  await createSupportTicket(undefined, {});
  expect(apiClient.post.mock.calls[0][2]).toEqual({});
});
