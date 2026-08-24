import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';

const CATEGORIES = [
  'trip_invitations', 'join_request_updates', 'funding_round_requests',
  'contribution_updates', 'settlement_updates', 'trip_lifecycle_updates',
];

// Preference controls only, per the brief -- no notification center/inbox
// here. Reads/writes go through the same PATCH /profile/ every other
// preference uses; the backend merges a partial update onto the stored
// map, so toggling one category never resets the others.
const AccountNotifications = () => {
  const { t } = useTranslation();
  const { user, saveProfile } = useAuth();
  const [errorKey, setErrorKey] = useState(null);

  const toggle = async (key, value) => {
    setErrorKey(null);
    try {
      await saveProfile({ notification_preferences: { [key]: value } });
    } catch {
      setErrorKey('account.errors.saveFailed');
    }
  };

  const enableAll = async () => {
    setErrorKey(null);
    try {
      await saveProfile({ notification_preferences: Object.fromEntries(CATEGORIES.map((key) => [key, true])) });
    } catch {
      setErrorKey('account.errors.saveFailed');
    }
  };

  const disableAll = async () => {
    setErrorKey(null);
    try {
      await saveProfile({ notification_preferences: Object.fromEntries(CATEGORIES.map((key) => [key, false])) });
    } catch {
      setErrorKey('account.errors.saveFailed');
    }
  };

  return (
    <section className="acc-card">
      <div className="acc-card__header-row">
        <h2 className="acc-card__title text-headline-sm">{t('account.notifications.title')}</h2>
        <div className="acc-notifications__bulk">
          <button type="button" className="acc-link" onClick={enableAll}>{t('account.notifications.enableAll')}</button>
          <button type="button" className="acc-link" onClick={disableAll}>{t('account.notifications.disableAll')}</button>
        </div>
      </div>
      <ul className="acc-notifications__list">
        {CATEGORIES.map((key) => (
          <li key={key} className="acc-notifications__item">
            <span className="text-copy">{t(`account.notifications.categories.${key}`)}</span>
            <label className="acc-switch">
              <input
                type="checkbox"
                checked={Boolean(user.notification_preferences?.[key])}
                onChange={(event) => toggle(key, event.target.checked)}
                aria-label={t(`account.notifications.categories.${key}`)}
              />
              <span className="acc-switch__track" aria-hidden="true" />
            </label>
          </li>
        ))}
      </ul>
      {errorKey && <p className="acc-error" role="alert">{t(errorKey)}</p>}
    </section>
  );
};

export default AccountNotifications;
