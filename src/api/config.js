const configuredApiBaseUrl = process.env.REACT_APP_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error('REACT_APP_API_BASE_URL is required. Configure it in the root .env file before starting or building the frontend.');
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');
export const API_TIMEOUT = 15000;

if (!/^https?:\/\//.test(API_BASE_URL)) {
  throw new Error('REACT_APP_API_BASE_URL must be an absolute HTTP(S) URL.');
}
