import { claimGuestMemberships } from '../features/auth/api/authApi';
import { clearGuestToken, getGuestToken } from '../api/credentials';
import { listGuestTrips, removeGuestTrip } from './guestTripsStore';

// Set right before navigating away from a successful automatic claim
// (AuthPage's registered-login success path) and consumed exactly once by
// AccountPage -- a plain sessionStorage flag, not a credential, so it's
// safe to read/write freely and naturally clears itself on tab close if
// never consumed.
const NOTICE_KEY = 'tripsplit:guest-merge-notice';

/*
  Guest -> registered account upgrade (Part N): every locally-known guest
  trip this device has a still-valid per-trip token for is submitted to
  the SAME server-side claim endpoint apps.trips.services.
  claim_guest_membership already exposes via ClaimGuestTripsBanner's
  manual flow -- this is the AUTOMATIC counterpart, fired once right
  after a successful registered OTP login, so a guest who then signs in
  doesn't have to separately notice and click a banner to keep their
  trips. Never claims anything without a real, server-reverified token
  (never trip id alone) -- same security guarantee as the manual path.
*/
export const claimAllLocalGuestTrips = async () => {
  const eligible = listGuestTrips()
    .map((entry) => ({ ...entry, token: getGuestToken(entry.trip_id) }))
    .filter((entry) => entry.token);
  if (eligible.length === 0) return { claimedCount: 0, results: [] };
  try {
    const { results } = await claimGuestMemberships(eligible.map((entry) => ({ trip_public_id: entry.trip_id, guest_token: entry.token })));
    results.forEach((result) => {
      clearGuestToken(result.trip_public_id);
      removeGuestTrip(result.trip_public_id);
    });
    const claimedCount = results.filter((result) => result.outcome === 'claimed').length;
    if (claimedCount > 0) {
      try { sessionStorage.setItem(NOTICE_KEY, String(claimedCount)); } catch { /* storage unavailable -- notice just won't show */ }
    }
    return { claimedCount, results };
  } catch {
    // Network/5xx: leave everything local untouched so a later manual
    // claim (ClaimGuestTripsBanner) or a future automatic retry still has
    // what it needs. Never surfaced as a login-blocking error -- the
    // registered session itself is already established regardless.
    return { claimedCount: 0, results: [] };
  }
};

export const consumeGuestMergeNotice = () => {
  try {
    const value = sessionStorage.getItem(NOTICE_KEY);
    if (!value) return 0;
    sessionStorage.removeItem(NOTICE_KEY);
    return Number(value) || 0;
  } catch {
    return 0;
  }
};
