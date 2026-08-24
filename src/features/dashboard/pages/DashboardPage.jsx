import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromUser } from '../../profile/utils/avatarKey';
import ClaimGuestTripsBanner from '../../auth/components/ClaimGuestTripsBanner';
import { useAuth } from '../../../auth/AuthContext';
import { getTrips } from '../../trips/api/tripsApi';
import '../../../styles/CardStyles.css';
import '../../../styles/legacyShell.css';
import './dashboard.css';

// The main authenticated landing area — account identity + trip history +
// Create/Join entry points, all reusing the existing trip-history endpoint
// and Neo-classic card styles (no new backend storage, no visual redesign).
const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTrips().then((result) => { if (!cancelled) setTrips(result.results); });
    return () => { cancelled = true; };
  }, []);

  if (!user || trips === null) return <PublicLayout><NeoLoading /></PublicLayout>;

  const groups = {
    active: trips.filter((trip) => !trip.archived_at && trip.lifecycle_status !== 'closed'),
    closed: trips.filter((trip) => !trip.archived_at && trip.lifecycle_status === 'closed'),
    archived: trips.filter((trip) => trip.archived_at),
  };

  return (
    <PublicLayout>
      <div className="legacy-shell">
        <h1 className="legacy-shell__page-title text-headline">{t('dashboard.title')}</h1>
        <div className="home-container-pc mt-5 dashboard-page">
          <div className="card-pc dashboard-identity">
            <Avatar avatarKey={avatarKeyFromUser(user)} displayName={user.display_name} size="lg" />
            <div className="dashboard-identity__meta">
              <strong>{user.display_name}</strong>
              <span>{user.email}</span>
            </div>
            <div className="dashboard-identity__actions">
              <Link className="pc-btn-join" to="/account">{t('account.pageTitle')}</Link>
              <button type="button" className="pc-btn-join" onClick={logout}>{t('common.logOut')}</button>
            </div>
          </div>

          <ClaimGuestTripsBanner />

          <div className="dashboard-actions">
            <Link className="pc-btn-create" to="/create-trip">{t('home.hero.createTrip')}</Link>
            <Link className="pc-btn-join" to="/trips/join">{t('home.hero.joinTrip')}</Link>
          </div>

          {trips.length === 0 ? (
            <div className="card-pc">
              <p><strong>{t('dashboard.empty.title')}</strong></p>
              <p>{t('dashboard.empty.description')}</p>
            </div>
          ) : (
            <div className="card-pc">
              <h2>{t('trip.history')}</h2>
              {Object.entries(groups).map(([status, rows]) => (
                <section key={status}>
                  <h3>{t(`trip.group.${status}`)}</h3>
                  {rows.length ? (
                    <div className="expenses-list">
                      {rows.map((trip) => (
                        <Link className="expense-item trip-history-item" key={trip.id} to={`/trip/${trip.id}`}>
                          <span>
                            <strong>{trip.title}</strong><br />
                            {trip.currency} {trip.budget} · {trip.member_count} {t('members.title')} · {t('dashboard.yourBalance')} {trip.current_balance}<br />
                            <small>{trip.last_activity_at ? new Date(trip.last_activity_at).toLocaleDateString() : '—'}</small>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : <p>{t(`trip.empty.${status}`)}</p>}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default DashboardPage;
