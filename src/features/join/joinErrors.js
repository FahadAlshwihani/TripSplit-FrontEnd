/*
  Same pattern as features/auth/authErrors.js: every request through
  apiClient rejects with an ApiError carrying {status, code, message} --
  this maps that into an i18n KEY (never pre-translated text, never the
  backend's raw English), so a language switch while an error is visible
  re-renders correctly and Arabic users never see raw backend English.
*/
const KNOWN_CODES = {
  trip_not_found: 'joinTrip.errors.notFound',
  invitation_invalid: 'joinTrip.errors.invitationInvalid',
  join_input_required: 'joinTrip.errors.notFound',
  join_lookup_rate_limited: 'joinTrip.errors.rateLimited',
  rate_limited: 'joinTrip.errors.rateLimited',
  invalid_room_password: 'joinTrip.errors.wrongPassword',
  room_password_rate_limited: 'joinTrip.errors.rateLimited',
};

export const getJoinErrorKey = (error, fallbackKey = 'joinTrip.errors.notFound') => {
  if (!error) return null;
  const byCode = error.code && KNOWN_CODES[error.code];
  if (byCode) return byCode;
  if (error.status === 429) return KNOWN_CODES.rate_limited;
  if (error.status === 0) return 'joinTrip.errors.network';
  return fallbackKey;
};
