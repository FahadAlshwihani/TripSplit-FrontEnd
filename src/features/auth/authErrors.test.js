import { getAuthErrorKey } from './authErrors';

test('maps known backend codes to their fixed i18n key regardless of context', () => {
  expect(getAuthErrorKey({ code: 'otp_invalid' })).toBe('auth.errors.otpInvalid');
  expect(getAuthErrorKey({ code: 'otp_expired' })).toBe('auth.errors.otpExpired');
  expect(getAuthErrorKey({ code: 'otp_too_many_attempts' })).toBe('auth.errors.otpTooManyAttempts');
  expect(getAuthErrorKey({ code: 'otp_resend_cooldown' })).toBe('auth.errors.resendCooldown');
  expect(getAuthErrorKey({ code: 'invalid_email' })).toBe('auth.errors.invalidEmail');
});

test('maps both rate_limited and otp_rate_limited codes to the same rate-limit key', () => {
  expect(getAuthErrorKey({ code: 'rate_limited' })).toBe('auth.errors.rateLimited');
  expect(getAuthErrorKey({ code: 'otp_rate_limited' })).toBe('auth.errors.rateLimited');
});

test('falls back to the rate-limit key for an HTTP 429 with an unrecognized code', () => {
  expect(getAuthErrorKey({ status: 429, code: 'too_many_requests' })).toBe('auth.errors.rateLimited');
});

test('falls back to the network key for a status-0 (no backend response) error', () => {
  expect(getAuthErrorKey({ status: 0, code: 'network_error' })).toBe('auth.errors.network');
  expect(getAuthErrorKey({ status: 0, code: 'request_timeout' })).toBe('auth.errors.network');
});

test('an unrecognized code or 5xx falls back to the caller-provided contextual key, not a hardcoded one', () => {
  expect(getAuthErrorKey({ status: 500, code: 'internal_error' }, 'auth.errors.requestFailed')).toBe('auth.errors.requestFailed');
  expect(getAuthErrorKey({ status: 500, code: 'internal_error' }, 'auth.errors.unknown')).toBe('auth.errors.unknown');
});

test('defaults the fallback key to auth.errors.unknown when the caller does not supply one', () => {
  expect(getAuthErrorKey({ status: 418, code: 'teapot' })).toBe('auth.errors.unknown');
});

test('returns null for a falsy error (no error to display)', () => {
  expect(getAuthErrorKey(null)).toBeNull();
  expect(getAuthErrorKey(undefined)).toBeNull();
});
