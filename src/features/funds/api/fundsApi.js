import { apiClient, responseData } from '../../../api/client';
import { tripRequest } from '../../../api/credentials';

const root = (id) => `/trips/${id}/fund`;

export const getFund = (id, config) => responseData(apiClient.get(`${root(id)}/`, tripRequest(id, config)));
export const createFund = (id, payload) => responseData(apiClient.post(`${root(id)}/`, payload, tripRequest(id)));
export const updateFund = (id, payload) => responseData(apiClient.patch(`${root(id)}/`, payload, tripRequest(id)));

export const createFundingRound = (id, payload) => responseData(apiClient.post(`${root(id)}/rounds/`, payload, tripRequest(id)));
export const completeFundingRound = (id, roundId) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/complete/`, {}, tripRequest(id)));
export const cancelFundingRound = (id, roundId) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/cancel/`, {}, tripRequest(id)));

// The Fund holder/admin recording a receipt directly -- always confirmed
// immediately (recording it IS the confirmation).
export const recordFundContribution = (id, roundId, payload) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/contributions/`, payload, tripRequest(id)));
// A member reporting their OWN payment -- always pending until the
// holder confirms/rejects it. See docs/architecture/fund-accounting.md.
export const reportFundContribution = (id, roundId, payload) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/contributions/report/`, payload, tripRequest(id)));
const contributionAction = (id, roundId, contributionId, action, payload = {}) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/contributions/${contributionId}/${action}/`, payload, tripRequest(id)));
export const confirmFundContribution = (id, roundId, contributionId) => contributionAction(id, roundId, contributionId, 'confirm');
export const rejectFundContribution = (id, roundId, contributionId, reason) => contributionAction(id, roundId, contributionId, 'reject', { reason });
export const retryFundContribution = (id, roundId, contributionId) => contributionAction(id, roundId, contributionId, 'retry');
export const correctFundContribution = (id, roundId, contributionId, payload) => contributionAction(id, roundId, contributionId, 'correct', payload);
export const voidFundContribution = (id, roundId, contributionId, reason) => contributionAction(id, roundId, contributionId, 'void', { reason });

// Fund contribution reminder -- a distinct event/template/domain from the
// Balances personal-debt reminder (see docs/architecture/notifications.md);
// never mix the two on either page.
export const remindContribution = (id, roundId, memberId) => responseData(apiClient.post(`${root(id)}/rounds/${roundId}/remind/${memberId}/`, {}, tripRequest(id)));

export const previewFundRefund = (id, payload) => responseData(apiClient.post(`${root(id)}/refund-preview/`, payload, tripRequest(id)));
export const recordFundRefunds = (id, payload) => responseData(apiClient.post(`${root(id)}/refunds/`, payload, tripRequest(id)));

export const recordFundReimbursement = (id, payload) => responseData(apiClient.post(`${root(id)}/reimbursements/`, payload, tripRequest(id)));

export const getFundCloseReadiness = (id, config) => responseData(apiClient.get(`${root(id)}/close-readiness/`, tripRequest(id, config)));
export const closeFund = (id) => responseData(apiClient.post(`${root(id)}/close/`, {}, tripRequest(id)));
