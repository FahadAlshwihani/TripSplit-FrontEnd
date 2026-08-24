import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromUser } from '../../profile/utils/avatarKey';
import { useAuth } from '../../../auth/AuthContext';
import ChangeEmailPanel from './ChangeEmailPanel';

const AccountIdentity = ({ onEditProfile }) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [changingEmail, setChangingEmail] = useState(false);

  return (
    <section className="acc-card acc-identity">
      <h2 className="acc-card__title text-headline-sm">{t('account.identity.title')}</h2>
      <div className="acc-identity__row">
        <Avatar avatarKey={avatarKeyFromUser(user)} displayName={user.display_name} size="lg" />
        <div className="acc-identity__meta">
          <h3 className="acc-identity__name text-headline-md">{user.display_name}</h3>
          <p className="acc-identity__email text-copy-sm">{user.email}</p>
          <span className="acc-badge">{t('account.identity.verified')}</span>
        </div>
      </div>
      <div className="acc-identity__actions">
        <button type="button" className="acc-btn" onClick={onEditProfile}>{t('account.identity.editProfile')}</button>
        <button type="button" className="acc-btn" onClick={() => setChangingEmail((current) => !current)}>{t('account.identity.changeEmail')}</button>
      </div>
      {changingEmail && (
        <ChangeEmailPanel onDone={() => { refreshUser(); setChangingEmail(false); }} />
      )}
    </section>
  );
};

export default AccountIdentity;
