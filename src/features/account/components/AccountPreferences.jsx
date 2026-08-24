import React from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyPicker from '../../../shared/components/CurrencyPicker';
import { useAuth } from '../../../auth/AuthContext';
import usePreferenceSave from '../hooks/usePreferenceSave';

/*
  Every preference here is account-scoped and server-authoritative: the
  visible value always comes from `user` (AuthContext, itself sourced from
  GET /auth/me and refreshed on every successful PATCH /profile/), never a
  separately-tracked local draft. Saving goes through usePreferenceSave --
  the SAME hook the authenticated nav's account dropdown uses for its own
  Theme/Language controls, so there is exactly one place this logic lives.
  All three controls share one fixed-width `.acc-select-shell` (see
  account.css) so the row never looks unfinished with mismatched widths.
*/
const AccountPreferences = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status, changeLanguage, changeTheme, changeCurrency } = usePreferenceSave();

  const fieldStatus = (field) => status[field];

  return (
    <section className="acc-card">
      <h2 className="acc-card__title text-headline-sm">{t('account.preferences.title')}</h2>
      <div className="acc-preferences">
        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.preferences.language')}</span>
          <div className="acc-preferences__control">
            <div className="acc-select-shell">
              <select
                className="acc-select"
                value={user.preferred_language}
                onChange={(event) => changeLanguage(event.target.value)}
                aria-label={t('account.preferences.language')}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            {fieldStatus('preferred_language') === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeLanguage(user.preferred_language === 'ar' ? 'en' : 'ar')}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>

        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.preferences.theme')}</span>
          <div className="acc-preferences__control">
            <div className="acc-select-shell">
              <select
                className="acc-select"
                value={user.preferred_theme}
                onChange={(event) => changeTheme(event.target.value)}
                aria-label={t('account.preferences.theme')}
              >
                <option value="light">{t('account.preferences.themeLight')}</option>
                <option value="dark">{t('account.preferences.themeDark')}</option>
              </select>
            </div>
            {fieldStatus('preferred_theme') === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeTheme(user.preferred_theme === 'dark' ? 'light' : 'dark')}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>

        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.preferences.currency')}</span>
          <div className="acc-preferences__control">
            <div className="acc-select-shell">
              <CurrencyPicker id="acc-currency" value={user.preferred_currency} onChange={changeCurrency} label={t('account.preferences.currency')} />
            </div>
            {fieldStatus('preferred_currency') === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeCurrency(user.preferred_currency)}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>
      </div>
      {Object.values(status).includes('error') && (
        <p className="acc-error" role="alert">{t('account.errors.saveFailed')}</p>
      )}
    </section>
  );
};

export default AccountPreferences;
