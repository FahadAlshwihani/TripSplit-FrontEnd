export class ApiError extends Error {
  constructor({ status = 0, code = 'network_error', message = 'Unable to reach the server.', fields = {}, original }) {
    super(message);
    this.name = 'ApiError'; this.status = status; this.code = code; this.fields = fields; this.original = original;
  }
}

export const normalizeApiError = (error) => {
  if (error instanceof ApiError) return error;
  const body = error?.response?.data || {};
  const cancelled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError';
  return new ApiError({ status: error?.response?.status || 0, code: body.code || (cancelled ? 'request_cancelled' : error?.code === 'ECONNABORTED' ? 'request_timeout' : 'network_error'), message: cancelled ? 'Request cancelled.' : body.message || error?.message || 'Unable to reach the server.', fields: body.fields || {}, original: error });
};

export const isRequestCancelled = (error) => error?.code === 'request_cancelled'
  || error?.code === 'ERR_CANCELED'
  || error?.name === 'CanceledError'
  || error?.name === 'AbortError';
