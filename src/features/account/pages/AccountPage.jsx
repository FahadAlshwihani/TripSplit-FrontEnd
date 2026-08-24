import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import ProfileSetupPage from '../../profile/pages/ProfileSetupPage';
import ClaimGuestTripsBanner from '../../auth/components/ClaimGuestTripsBanner';
import { useAuth } from '../../../auth/AuthContext';
import AccountIdentity from '../components/AccountIdentity';
import AccountPreferences from '../components/AccountPreferences';
import AccountNotifications from '../components/AccountNotifications';
import AccountTrips from '../components/AccountTrips';
import '../styles/account.css';

/*
  The global, outside-any-trip account hub -- GatedRoute already ensures
  this only renders for an authenticated, restored user (see
  app/routes/accountRoutes.jsx). Edit Profile reuses the exact same
  Complete-Profile component every other identity-editing surface this
  app has (onboarding, guest setup, Join Trip's guest "Change") rather
  than a second profile-editing system, toggled inline like Join Trip's
  guest editor -- no separate route, no navigation away from Account.
*/
const AccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // A "Change" click from Join Trip (or any other safe-internal-
  // continuation caller) arrives with a `next` to return to once the
  // profile is saved -- only ever set by in-app navigation state, never
  // an untrusted query param, so no open-redirect risk.
  const next = location.state?.next;
  const { user, authLoading, saveProfile, logout } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrorKey, setProfileErrorKey] = useState(null);

  const saveEditedProfile = async (profile) => {
    setSavingProfile(true);
    setProfileErrorKey(null);
    try {
      await saveProfile(profile);
      if (next) { navigate(next); return; }
      setEditingProfile(false);
    } catch {
      setProfileErrorKey('account.errors.saveFailed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading || !user) return <PublicLayout><NeoLoading /></PublicLayout>;

  if (editingProfile) {
    return (
      <ProfileSetupPage
        busy={savingProfile}
        errorKey={profileErrorKey}
        initialValues={user}
        onSubmit={saveEditedProfile}
        onCancel={() => (next ? navigate(next) : setEditingProfile(false))}
      />
    );
  }

  return (
    <PublicLayout>
      <div className="acc-page">
        <header className="acc-header">
          {next && <button type="button" className="acc-link" onClick={() => navigate(next)}>{t('common.back')}</button>}
          <h1 className="acc-header__title text-display">{t('account.pageTitle')}</h1>
          <p className="acc-header__subtitle text-copy-lg">{t('account.pageSubtitle')}</p>
        </header>

        {/*
          Desktop hierarchy: Identity+Quick Actions, then Preferences+
          Notifications, then Logout -- stacked in that order at the
          BOTTOM of the left column, with Trips dominant on the right,
          spanning the full column height. Mobile hierarchy: the same
          two left blocks, then Trips, then Logout LAST -- Logout must
          never sit before trip history on a long page. A single DOM
          order can't satisfy both (desktop wants Logout mid-column,
          mobile wants it after Trips), so each block is its own grid
          item positioned explicitly per breakpoint in account.css
          (mobile: plain DOM order top-to-bottom; desktop: named
          grid-row/grid-column placement) rather than nested containers.
        */}
        <div className="acc-grid">
          <section className="acc-grid__identity">
            <AccountIdentity onEditProfile={() => setEditingProfile(true)} />
            <section className="acc-quick-actions">
              <Link className="acc-btn acc-btn--primary" to="/create-trip">{t('home.hero.createTrip')}</Link>
              <Link className="acc-btn" to="/trips/join">{t('home.hero.joinTrip')}</Link>
            </section>
            <ClaimGuestTripsBanner />
          </section>
          <section className="acc-grid__preferences">
            <AccountPreferences />
            <AccountNotifications />
          </section>
          <section className="acc-grid__trips">
            <AccountTrips />
          </section>
          <button type="button" className="acc-btn acc-btn--danger acc-logout acc-grid__logout" onClick={handleLogout}>
            {t('common.logOut')}
          </button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AccountPage;
