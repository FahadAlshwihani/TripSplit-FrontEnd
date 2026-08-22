/*
  Normalizes an ApiError (see src/api/errors.js — every request made through
  apiClient already rejects with one of these, carrying {status, code,
  message}) into an i18n KEY, never a pre-translated string or raw backend
  text. Callers store the returned key in state and render it with t(key)
  at display time, so a language switch while an error is visible
  re-renders it correctly instead of leaving stale English/Arabic text.

  Codes the backend is known/expected to send map to a fixed, context-
  independent key. Anything unrecognized (including a plain network
  failure with no backend response at all) falls back to the caller's own
  contextKey — e.g. "couldn't send the code" reads correctly for a
  request-otp failure but would be nonsensical for a verify failure, so
  the fallback is intentionally not hard-coded here.
*/

const KNOWN_CODES = {
  invalid_email: 'auth.errors.invalidEmail',
  otp_invalid: 'auth.errors.otpInvalid',
  otp_expired: 'auth.errors.otpExpired',
  otp_too_many_attempts: 'auth.errors.otpTooManyAttempts',
  rate_limited: 'auth.errors.rateLimited',
  otp_rate_limited: 'auth.errors.rateLimited',
  otp_resend_cooldown: 'auth.errors.resendCooldown',
  network_error: 'auth.errors.network',
  request_timeout: 'auth.errors.network',
};

export const getAuthErrorKey = (error, fallbackKey = 'auth.errors.unknown') => {
  if (!error) return null;
  const byCode = error.code && KNOWN_CODES[error.code];
  if (byCode) return byCode;
  if (error.status === 429) return KNOWN_CODES.rate_limited;
  if (error.status === 0) return KNOWN_CODES.network_error;
  if (error.status >= 500) return fallbackKey;
  return fallbackKey;
};

// The standalone OTP verification card (see OtpStep.jsx) uses its own
// auth.otp.errors.* namespace instead of the shared auth.errors.* one, so a
// verify/resend failure there reads naturally in that screen's own voice
// ("That code isn't correct.") rather than the email-step's generic
// "request failed" phrasing. otp_too_many_attempts and a plain HTTP 429
// both fold into the same "too many attempts" copy — the OTP card doesn't
// distinguish IP-level throttling from attempt-count limiting, since both
// tell the user the same thing: stop retrying and request a fresh code.
const OTP_KNOWN_CODES = {
  otp_invalid: 'auth.otp.errors.invalid',
  otp_expired: 'auth.otp.errors.expired',
  otp_too_many_attempts: 'auth.otp.errors.tooManyAttempts',
  otp_rate_limited: 'auth.otp.errors.tooManyAttempts',
  rate_limited: 'auth.otp.errors.tooManyAttempts',
  network_error: 'auth.otp.errors.network',
  request_timeout: 'auth.otp.errors.network',
};

export const getOtpErrorKey = (error, fallbackKey = 'auth.otp.errors.unknown') => {
  if (!error) return null;
  const byCode = error.code && OTP_KNOWN_CODES[error.code];
  if (byCode) return byCode;
  if (error.status === 429) return OTP_KNOWN_CODES.rate_limited;
  if (error.status === 0) return OTP_KNOWN_CODES.network_error;
  if (error.status >= 500) return 'auth.otp.errors.server';
  return fallbackKey;
};
