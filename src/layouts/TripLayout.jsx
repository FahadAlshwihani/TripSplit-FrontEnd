import React, { useMemo } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardShell from '../features/dashboard/layout/DashboardShell';
import NeoLoading from '../shared/components/NeoLoading';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import { getTrip } from '../features/trips/api/tripsApi';
import { permissionsFor } from '../shared/utils/permissions';

/*
  Fetches trip + current-member data once, at the workspace root, and
  hands it down to both DashboardShell (sidebar/topbar context, nav
  gating) and every trip-scoped page (via <Outlet context>) -- pages
  never re-fetch the trip themselves. DashboardShell owns presentation
  only; this component owns data and lifecycle/permission derivation,
  unchanged from before this task's shell rework.
*/
export default function TripLayout() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const resource = useRouteResource((signal) => getTrip(tripId, { signal }), tripId);
  const trip = resource.data;
  const setTrip = resource.setData;
  const currentMember = trip?.current_member;
  const permissions = useMemo(
    () => permissionsFor(currentMember, Boolean(trip?.archived_at), trip?.lifecycle_status === 'closed'),
    [currentMember, trip],
  );

  if (resource.loading) return <NeoLoading />;

  if (resource.error || !trip) {
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

  return (
    <DashboardShell trip={trip} tripId={tripId} currentMember={currentMember} permissions={permissions}>
      <Outlet context={{ trip, setTrip, tripId, currentMember, permissions, reloadTrip: resource.retry }} />
    </DashboardShell>
  );
}
