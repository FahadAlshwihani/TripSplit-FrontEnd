import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';
import usePreferenceSave from './usePreferenceSave';

// Shared presentation adapter for Account, Settings, and Quick Actions.
// Registered preferences flow through AuthContext -> PATCH /profile/;
// guest preferences stay in the existing i18next/ThemeProvider sources.
export default function usePreferenceControls() {
  const { i18n } = useTranslation();
  const { user, isAuthenticated, authLoading } = useAuth();
  const theme = useTheme();
  const savedPreferences = usePreferenceSave();

  const language = isAuthenticated
    ? user?.preferred_language
    : (i18n.language === 'ar' ? 'ar' : 'en');
  const themeValue = isAuthenticated
    ? user?.preferred_theme
    : (theme?.theme === 'dark' ? 'dark' : 'light');

  const changeLanguage = (value) => {
    if (isAuthenticated) savedPreferences.changeLanguage(value);
    else i18n.changeLanguage(value);
  };

  const changeTheme = (value) => {
    if (isAuthenticated) savedPreferences.changeTheme(value);
    else theme?.setTheme(value);
  };

  return {
    language,
    theme: themeValue,
    changeLanguage,
    changeTheme,
    status: savedPreferences.status,
    authLoading,
    isAuthenticated,
  };
}
