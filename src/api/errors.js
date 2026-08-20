export class ApiError extends Error {
  constructor({ status = 0, code = 'network_error', message = 'Unable to reach the server.', fields = {}, original }) {
    super(message);
    this.name = 'ApiError'; this.status = status; this.code = code; this.fields = fields; this.original = original;
  }
}

export const normalizeApiError = (error) => {
  if (error instanceof ApiError) return error;
  const body = error?.response?.data || {};
  return new ApiError({ status: error?.response?.status || 0, code: body.code || (error?.code === 'ECONNABORTED' ? 'request_timeout' : 'network_error'), message: body.message || error?.message || 'Unable to reach the server.', fields: body.fields || {}, original: error });
};
