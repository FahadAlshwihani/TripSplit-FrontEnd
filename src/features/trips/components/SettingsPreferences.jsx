import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';
import usePreferenceSave from '../../account/hooks/usePreferenceSave';
import SectionLoading from '../../../shared/components/SectionLoading';

/*
  Language + Theme only -- account/UI preferences, never trip-scoped
  state (no currency, join policy, or notifications here; those stay
  on the General Ledger / Access & Security cards or don't exist yet).

  A registered user reads/writes through usePreferenceSave(), the
  exact same hook AccountPreferences (the /account page) and
  AccountMenu (the authenticated nav dropdown) already use -- one
  canonical save path, server-authoritative (`user.preferred_language`
  /`preferred_theme`), never a Settings-local draft or a second
  preference state.

  A guest has no profile to PATCH, so this falls back to the same
  local ThemeProvider/i18next primitives ThemeSwitch/LanguageSwitch
  already use for anonymous visitors -- still the existing canonical
  value for that case (there is no server preference to read), not a
  new state invented for this card.
*/
export default function SettingsPreferences() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, authLoading } = useAuth();
  const theme = useTheme();
  const { changeLanguage, changeTheme } = usePreferenceSave();

  if (authLoading) {
    return (
      <section className="set-preferences-card">
        <h3 className="set-preferences-card__title">{t('settings.preferences.title')}</h3>
        <SectionLoading minHeight={72} compact />
      </section>
    );
  }

  const language = isAuthenticated ? user.preferred_language : (i18n.language === 'ar' ? 'ar' : 'en');
  const themeValue = isAuthenticated ? user.preferred_theme : (theme?.theme === 'dark' ? 'dark' : 'light');

  const onLanguageChange = (value) => {
    if (isAuthenticated) changeLanguage(value);
    else i18n.changeLanguage(value);
  };

  const onThemeChange = (value) => {
    if (isAuthenticated) changeTheme(value);
    else theme?.setTheme(value);
  };

  return (
    <section className="set-preferences-card">
      <h3 className="set-preferences-card__title">{t('settings.preferences.title')}</h3>

      <div className="set-preferences-card__row">
        <label className="set-preferences-card__label" htmlFor="set-preferences-language">{t('settings.preferences.language')}</label>
        <select
          id="set-preferences-language"
          className="set-preferences-card__select"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      <div className="set-preferences-card__row">
        <label className="set-preferences-card__label" htmlFor="set-preferences-theme">{t('settings.preferences.theme')}</label>
        <select
          id="set-preferences-theme"
          className="set-preferences-card__select"
          value={themeValue}
          onChange={(event) => onThemeChange(event.target.value)}
        >
          <option value="light">{t('account.preferences.themeLight')}</option>
          <option value="dark">{t('account.preferences.themeDark')}</option>
        </select>
      </div>
    </section>
  );
}
