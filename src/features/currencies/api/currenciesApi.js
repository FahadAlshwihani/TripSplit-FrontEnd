import { apiClient, responseData } from '../../../api/client'; export const getCurrencies=()=>responseData(apiClient.get('/currencies/'));
export const getExchangeRate = (base, quote, date, config) => responseData(apiClient.get('/exchange-rates/', { ...config, params: { base, quote, ...(date ? { date } : {}) } }));
