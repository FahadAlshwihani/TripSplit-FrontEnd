import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import usePreferenceSave from '../hooks/usePreferenceSave';

const IDLE_OPTIONS = [null, 5, 10, 15, 20, 30, 45, 60];
const optionKey = (value) => (value === null ? 'never' : String(value));

/*
  Account > Security card -- matches AccountIdentity/AccountPreferences'
  existing styling (same .acc-card/.acc-select-shell/.acc-btn primitives,
  no new visual system). Default is always "Never" (user.idle_logout_minutes
  is null unless the user has explicitly chosen otherwise) -- this control
  only ever reflects the server-authoritative value, same convention as
  AccountPreferences.
*/
const AccountSecurity = () => {
  const { t } = useTranslation();
  const { user, logoutAllDevices } = useAuth();
  const { status, changeIdleLogoutMinutes } = usePreferenceSave();
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState(false);

  const handleIdleChange = (event) => {
    const raw = event.target.value;
    changeIdleLogoutMinutes(raw === 'never' ? null : Number(raw));
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    setLogoutAllError(false);
    try {
      await logoutAllDevices();
    } catch {
      setLogoutAllError(true);
      setLoggingOutAll(false);
    }
  };

  return (
    <section className="acc-card">
      <h2 className="acc-card__title text-headline-sm">{t('account.security.title')}</h2>
      <p className="acc-security__device text-copy">{t('account.security.currentDevice')}</p>

      <div className="acc-preferences">
        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.security.idleLabel')}</span>
          <div className="acc-preferences__control">
            <div className="acc-select-shell">
              <select
                className="acc-select"
                value={optionKey(user.idle_logout_minutes ?? null)}
                onChange={handleIdleChange}
                aria-label={t('account.security.idleLabel')}
              >
                {IDLE_OPTIONS.map((value) => (
                  <option key={optionKey(value)} value={optionKey(value)}>{t(`account.security.idleOptions.${optionKey(value)}`)}</option>
                ))}
              </select>
            </div>
            {status.idle_logout_minutes === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeIdleLogoutMinutes(user.idle_logout_minutes ?? null)}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>
      </div>
      <p className="acc-security__description text-copy-sm">{t('account.security.idleDescription')}</p>
      {status.idle_logout_minutes === 'error' && (
        <p className="acc-error" role="alert">{t('account.security.errors.saveFailed')}</p>
      )}

      <p className="acc-security__helper text-copy-sm">{t('account.security.idleHelper')}</p>

      {/*
        Plain "Log out" already exists prominently at the bottom of the
        Account page (acc-grid__logout) -- not duplicated here to avoid
        two identically-labeled buttons on one page; "Log out from all
        devices" is the one action genuinely specific to this card.
      */}
      <div className="acc-security__actions">
        <button type="button" className="acc-btn acc-btn--danger" onClick={handleLogoutAll} disabled={loggingOutAll}>
          {t('account.security.logoutAll')}
        </button>
      </div>
      {logoutAllError && <p className="acc-error" role="alert">{t('account.security.errors.logoutAllFailed')}</p>}
    </section>
  );
};

export default AccountSecurity;
