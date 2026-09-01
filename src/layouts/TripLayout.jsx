import React, { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardShell from '../features/dashboard/layout/DashboardShell';
import NeoLoading from '../shared/components/NeoLoading';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import { getTrip } from '../features/trips/api/tripsApi';
import { getGuestToken, saveGuestToken } from '../api/credentials';
import { permissionsFor } from '../shared/utils/permissions';

/*
  Fetches trip + current-member data once, at the workspace root, and
  hands it down to both DashboardShell (sidebar/topbar context, nav
  gating) and every trip-scoped page (via <Outlet context>) -- pages
  never re-fetch the trip themselves. DashboardShell owns presentation
  only; this component owns data and lifecycle/permission derivation.

  The URL's own :tripId segment may be EITHER the trip's short, opaque
  share-facing short_code (the canonical, going-forward form) or its
  UUID id (any legacy/bookmarked link) -- getTrip() accepts either
  (apps.trips.services.resolve_trip on the backend). Every trip-scoped
  PAGE'S own API calls keep using the UUID `id` exactly as they always
  have (passed through Outlet context unchanged) -- only DashboardShell
  (sidebar/topbar/mobile-nav, which BUILD the visible browser URLs for
  in-app navigation) gets the short_code, so clicking around the app
  stays on canonical short URLs. Once the trip loads, if the URL segment
  wasn't already the canonical short_code, this replaces the address bar
  with the canonical form (never a new history entry) -- see the
  redirect effect below.
*/
export default function TripLayout() {
  const { tripId: urlTripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const resource = useRouteResource((signal) => getTrip(urlTripId, { signal }), urlTripId);
  const trip = resource.data;
  const setTrip = resource.setData;
  const currentMember = trip?.current_member;
  const permissions = useMemo(
    () => permissionsFor(currentMember, Boolean(trip?.archived_at), trip?.lifecycle_status === 'closed'),
    [currentMember, trip],
  );

  // Guest tokens are saved under whichever identifier form was current
  // at join/create time (see tripsApi.js), but an existing guest can
  // still reach this trip via a DIFFERENT form than the one their
  // token happens to be keyed under (a pre-existing bookmark that's
  // about to canonicalize below, or a freshly shared short_code link
  // for a trip they already joined under the UUID form). Mirroring
  // here -- synchronously during render, not in a useEffect -- runs
  // before any child page mounts and fires its own API call, so every
  // subsequent request (all of which use the UUID `id`, see above)
  // finds the right token regardless of which form the address bar
  // held on this particular load.
  if (trip) {
    const token = getGuestToken(urlTripId) || getGuestToken(trip.id) || getGuestToken(trip.short_code);
    if (token) {
      saveGuestToken(trip.id, token);
      if (trip.short_code) saveGuestToken(trip.short_code, token);
    }
  }

  useEffect(() => {
    if (!trip?.short_code || urlTripId === trip.short_code) return;
    const canonicalPath = location.pathname.replace(`/trips/${urlTripId}`, `/trips/${trip.short_code}`);
    navigate(`${canonicalPath}${location.search}${location.hash}`, { replace: true });
  }, [trip, urlTripId, location, navigate]);

  // Only the true first load (no trip data at all yet) is a full-page
  // block -- the canonicalizing redirect above triggers a background
  // refetch under the new URL, which must never blank a page that's
  // already showing perfectly good data.
  if (resource.loading && !trip) return <NeoLoading />;

  if (resource.error && !trip) {
    const messages = {
      403: t('trip.errors.accessDenied'),
      404: t('trip.errors.notFound'),
      trip_banned: t('trip.errors.banned'),
      guest_access_invalid: t('trip.errors.guestAccessExpired'),
    };
    return (
      <div className="dash-fatal-error">
        <ErrorState
          title={t('error.loadTrip')}
          message={messages[resource.error?.code] || messages[resource.error?.status] || resource.error?.message}
          onRetry={resource.retry}
        />
        <button type="button" className="dash-btn dash-btn--secondary" onClick={() => navigate('/')}>{t('common.home')}</button>
      </div>
    );
  }

  if (!trip) return <NeoLoading />;

  return (
    <DashboardShell trip={trip} tripId={trip.short_code} currentMember={currentMember} permissions={permissions}>
      <Outlet context={{ trip, setTrip, tripId: trip.id, currentMember, permissions, reloadTrip: resource.retry }} />
    </DashboardShell>
  );
}
