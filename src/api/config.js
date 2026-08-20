export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
export const API_TIMEOUT = 15000;

if (!/^https?:\/\//.test(API_BASE_URL)) {
  throw new Error('REACT_APP_API_BASE_URL must be an absolute HTTP(S) URL.');
}
