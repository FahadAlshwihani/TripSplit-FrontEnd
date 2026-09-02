import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromUser, avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import SectionLoading from '../../../shared/components/SectionLoading';

/*
  A compact shortcut, never a second profile editor -- the global User
  is the sole source of truth for name/email/avatar/preferences; this
  card copies none of it onto Trip/TripMember, it only ever reads the
  same `useAuth()` context every other account-aware surface (
  AccountMenu, AccountIdentity) already reads, so a profile edit made
  on /account is reflected here on next render with no extra fetch and
  no stale trip-local snapshot.

  A registered user (the common Settings case) sees their real name/
  email/avatar and a link to /account, the one canonical profile page
  (Governance/other flows never invented a second one -- /profile and
  /account/profile both already redirect here). A guest sees their own
  real trip display name/avatar (from `currentMember`, never faked)
  plus a "Guest" badge and a Sign In action -- reusing the existing
  /auth page, which already claims local guest trip memberships onto
  the account on successful sign-in (see shared/guestClaim.js) -- not
  a new authentication flow invented for this card.
*/
export default function SettingsAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentMember } = useOutletContext();
  const { user, isAuthenticated, authLoading } = useAuth();

  return (
    <section className="set-account-card">
      <h3 className="set-account-card__title">{t('settings.account.title')}</h3>

      {authLoading && <SectionLoading minHeight={72} compact />}

      {!authLoading && isAuthenticated && user && (
        <>
          <div className="set-account-card__row">
            <Avatar avatarKey={avatarKeyFromUser(user)} displayName={user.display_name} size="md" />
            <div className="set-account-card__meta">
              <p className="set-account-card__name">{user.display_name}</p>
              <p className="set-account-card__email">{user.email}</p>
            </div>
          </div>
          <button type="button" className="set-remove-password" onClick={() => navigate('/account')}>
            {t('settings.account.editProfile')}
          </button>
        </>
      )}

      {!authLoading && !isAuthenticated && (
        <>
          <div className="set-account-card__row">
            <Avatar avatarKey={avatarKeyFromAvatar(currentMember?.avatar)} displayName={currentMember?.display_name} size="md" />
            <div className="set-account-card__meta">
              <p className="set-account-card__name">{currentMember?.display_name}</p>
              <span className="set-account-card__guest-badge">{t('settings.account.guestBadge')}</span>
            </div>
          </div>
          <p className="set-hint">{t('settings.account.guestHint')}</p>
          <button type="button" className="set-remove-password" onClick={() => navigate('/auth')}>
            {t('settings.account.signIn')}
          </button>
        </>
      )}
    </section>
  );
}
