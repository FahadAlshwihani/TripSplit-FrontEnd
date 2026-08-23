import { apiClient, responseData } from '../../../api/client';

export const getJoinCapability = (parsed, config) => responseData(
  apiClient.get('/join/capability/', { ...config, params: { [parsed.mode]: parsed.value } })
);

export const requestInvitationOtp = (token) => responseData(apiClient.post(`/invitations/${token}/otp/request/`, {}));
export const verifyInvitationOtp = (token, payload) => responseData(apiClient.post(`/invitations/${token}/otp/verify/`, payload));
