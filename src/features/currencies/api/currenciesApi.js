import { apiClient, responseData } from '../../../api/client'; export const getCurrencies=()=>responseData(apiClient.get('/currencies/'));
