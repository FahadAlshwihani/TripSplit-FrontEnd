import { apiClient, responseData } from '../../../api/client';
import { guestDeviceRequest } from '../../../api/credentials';

// The guest-side counterpart to GET /auth/me/ -- see
// docs/api/guest-session.md. AllowAny on the backend: a missing/invalid
// device token resolves to { guest: null, trips: [] }, never an error.
export const getGuestSession = () => responseData(apiClient.get('/guest/me/', guestDeviceRequest()));
export const updateGuestPreferences = (payload) => responseData(apiClient.patch('/guest/preferences/', payload, guestDeviceRequest()));
