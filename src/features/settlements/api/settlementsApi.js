import { apiClient, responseData } from '../../../api/client'; import { tripRequest } from '../../../api/credentials';
export const getSettlements=(id,config)=>responseData(apiClient.get(`/trips/${id}/settlements/`,tripRequest(id,config))); export const addSettlement=(id,p)=>responseData(apiClient.post(`/trips/${id}/settlements/`,p,tripRequest(id))); export const updateSettlement=(id,s,p)=>responseData(apiClient.patch(`/trips/${id}/settlements/${s}/`,p,tripRequest(id))); export const deleteSettlement=(id,s)=>responseData(apiClient.delete(`/trips/${id}/settlements/${s}/`,tripRequest(id))); export const reviewSettlement=(id,s,d)=>responseData(apiClient.post(`/trips/${id}/settlements/${s}/${d}/`,{},tripRequest(id)));
export const getSettlementPage=(url,id,config)=>responseData(apiClient.get(url,tripRequest(id,config)));
// Two-sided settlement workflow -- see docs/api/settlements.md. Status is
// decided server-side from the actor's real relationship to the payment,
// never trusted from the client.
export const reportPayment=(id,p)=>responseData(apiClient.post(`/trips/${id}/settlements/report/`,p,tripRequest(id)));
export const recordReceivedPayment=(id,p)=>responseData(apiClient.post(`/trips/${id}/settlements/record-received/`,p,tripRequest(id)));
export const recordAdminSettlement=(id,p)=>responseData(apiClient.post(`/trips/${id}/settlements/admin-record/`,p,tripRequest(id)));
export const getSettlementTimeline=(id,s,config)=>responseData(apiClient.get(`/trips/${id}/settlements/${s}/timeline/`,tripRequest(id,config)));
