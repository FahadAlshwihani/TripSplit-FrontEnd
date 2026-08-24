import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyPicker from '../../../shared/components/CurrencyPicker';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';

/*
  Every preference here is account-scoped and server-authoritative: the
  visible value always comes from `user` (AuthContext, itself sourced from
  GET /auth/me and refreshed on every successful PATCH /profile/), never a
  separately-tracked local draft. A change applies its visible side effect
  (theme attribute, i18n language) OPTIMISTICALLY for instant feedback, but
  rolls that back if the PATCH fails -- so the UI never keeps pretending a
  save succeeded when the server rejected it. No field here ever re-saves
  itself in response to `user` changing (that would be the PATCH-loop the
  brief explicitly warns against) -- saves only happen from a direct user
  action (onChange), never from an effect watching `user`.
*/
const AccountPreferences = () => {
  const { t, i18n } = useTranslation();
  const { user, saveProfile } = useAuth();
  const theme = useTheme();
  const [status, setStatus] = useState({});

  const save = async (field, value, { applyLocally, rollback } = {}) => {
    setStatus((current) => ({ ...current, [field]: 'saving' }));
    applyLocally?.();
    try {
      await saveProfile({ [field]: value });
      setStatus((current) => ({ ...current, [field]: 'saved' }));
    } catch {
      rollback?.();
      setStatus((current) => ({ ...current, [field]: 'error' }));
    }
  };

  const changeLanguage = (lang) => {
    const previous = i18n.language;
    save('preferred_language', lang, { applyLocally: () => i18n.changeLanguage(lang), rollback: () => i18n.changeLanguage(previous) });
  };

  const changeTheme = (value) => {
    const previous = theme?.theme;
    save('preferred_theme', value, { applyLocally: () => theme?.setTheme(value), rollback: () => theme?.setTheme(previous) });
  };

  const changeCurrency = (code) => save('preferred_currency', code);

  const fieldStatus = (field) => status[field];

  return (
    <section className="acc-card">
      <h2 className="acc-card__title text-headline-sm">{t('account.preferences.title')}</h2>
      <div className="acc-preferences">
        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.preferences.language')}</span>
          <div className="acc-preferences__control">
            <select
              className="acc-select"
              value={user.preferred_language}
              onChange={(event) => changeLanguage(event.target.value)}
              aria-label={t('account.preferences.language')}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            {fieldStatus('preferred_language') === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeLanguage(user.preferred_language === 'ar' ? 'en' : 'ar')}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>

        <div className="acc-preferences__row">
          <span className="acc-preferences__label text-copy">{t('account.preferences.theme')}</span>
          <div className="acc-preferences__control">
            <select
              className="acc-select"
              value={user.preferred_theme}
              onChange={(event) => changeTheme(event.target.value)}
              aria-label={t('account.preferences.theme')}
            >
              <option value="light">{t('account.preferences.themeLight')}</option>
              <option value="dark">{t('account.preferences.themeDark')}</option>
            </select>
            {fieldStatus('preferred_theme') === 'error' && (
              <button type="button" className="acc-retry" onClick={() => changeTheme(user.preferred_theme === 'dark' ? 'light' : 'dark')}>{t('account.errors.retry')}</button>
            )}
          </div>
        </div>

        <div className="acc-preferences__row acc-preferences__row--currency">
          <span className="acc-preferences__label text-copy">{t('account.preferences.currency')}</span>
          <div className="acc-preferences__control">
            <CurrencyPicker id="acc-currency" value={user.preferred_currency} onChange={changeCurrency} label={t('account.preferences.currency')} />
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
