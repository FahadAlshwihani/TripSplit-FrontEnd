import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGuestSession } from '../api/guestSessionApi';

// States that can be acted on by routing through the canonical Join Trip
// flow (never a direct trip-URL deep link -- see docs/architecture/
// guest-identity.md: the join submission is what actually resumes/
// reactivates the membership via the device credential; the capability
// PREVIEW on that page doesn't yet know about device continuity, but the
// submission always resolves correctly). Banned/closed/archived are
// read-only notices, never a clickable action.
const ACTIONABLE_STATES = new Set(['active', 'left', 'removed']);

/*
  "Your trips on this device" -- this-device guest history (Part K),
  shown on the returning-guest screen so "Continue as {name}" isn't the
  only signal a device's saved trips still exist. Fetches once; a failure
  here never blocks "Continue as {name}" itself (that path doesn't depend
  on this list), so failures are silent/non-blocking rather than an error
  banner over the whole screen.
*/
const GuestTripsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGuestSession().then((result) => { if (!cancelled) setTrips(result?.trips || []); }).catch(() => { if (!cancelled) setTrips([]); });
    return () => { cancelled = true; };
  }, []);

  if (!trips || trips.length === 0) return null;

  return (
    <div className="auth-guest-trips">
      <p className="auth-guest-trips__title text-label">{t('guest.trips.title')}</p>
      <ul className="auth-guest-trips__list">
        {trips.map((trip) => {
          const actionable = ACTIONABLE_STATES.has(trip.state);
          return (
            <li key={trip.trip_public_id} className="auth-guest-trips__row">
              <span className="auth-guest-trips__name text-copy">{trip.title}</span>
              {actionable ? (
                <button
                  type="button"
                  className="auth-guest-trips__action text-label"
                  onClick={() => navigate(`/trips/join?code=${encodeURIComponent(trip.join_code)}`)}
                >
                  {t(`guest.trips.state.${trip.state}`)}
                </button>
              ) : (
                <span className="auth-guest-trips__notice text-copy-sm">{t(`guest.trips.state.${trip.state}`)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GuestTripsList;
