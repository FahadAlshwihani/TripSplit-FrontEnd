import { apiClient, responseData } from '../../../api/client';
export const requestOtp = (email) => responseData(apiClient.post('/auth/otp/request/', { email }));
export const verifyOtp = (payload) => responseData(apiClient.post('/auth/otp/verify/', payload));
export const getCurrentUser = () => responseData(apiClient.get('/auth/me/'));
export const logout = () => responseData(apiClient.post('/auth/logout/'));
export const updateProfile = (payload) => responseData(apiClient.patch('/profile/', payload));
export const requestEmailChange = (email) => responseData(apiClient.post('/profile/email/change/request/', { email }));
export const verifyEmailChange = (payload) => responseData(apiClient.post('/profile/email/change/verify/', payload));
