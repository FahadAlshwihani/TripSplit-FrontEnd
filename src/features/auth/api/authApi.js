import { apiClient, responseData } from '../../../api/client';
export const requestOtp = (email) => responseData(apiClient.post('/auth/otp/request/', { email }));
export const verifyOtp = (payload) => responseData(apiClient.post('/auth/otp/verify/', payload));
export const getCurrentUser = () => responseData(apiClient.get('/auth/me/'));
export const logout = () => responseData(apiClient.post('/auth/logout/'));
export const logoutAllDevices = () => responseData(apiClient.post('/auth/logout-all/'));
// The ONLY call that refreshes the server's idle-timeout clock — never
// called on a fixed interval, only from SessionLifecycle's throttled,
// interaction-gated heartbeat. See docs/architecture/authentication.md.
export const recordActivity = () => responseData(apiClient.post('/auth/activity/'));
export const updateProfile = (payload) => responseData(apiClient.patch('/profile/', payload));
export const requestEmailChange = (email) => responseData(apiClient.post('/profile/email/change/request/', { email }));
export const verifyEmailChange = (payload) => responseData(apiClient.post('/profile/email/change/verify/', payload));
export const claimGuestMemberships = (claims) => responseData(apiClient.post('/account/claim-guest-memberships/', { claims }));
