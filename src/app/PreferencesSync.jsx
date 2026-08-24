import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../components/ThemeProvider';

/*
  Read-only reconciliation: once the authenticated profile resolves,
  the server's preferred_theme/preferred_language become authoritative
  over whatever was cached locally (pre-auth bootstrap, or a previous
  account on this device) -- never the other way around. This only ever
  calls setTheme()/changeLanguage(), which persist to the SAME local
  caches those already read from (tripsplit:theme, i18next's own
  detector) for next boot; it never PATCHes the profile back, so there is
  no update-triggers-update loop.
*/
const PreferencesSync = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!user) return;
    if (user.preferred_theme && theme && user.preferred_theme !== theme.theme) {
      theme.setTheme(user.preferred_theme);
    }
    if (user.preferred_language && user.preferred_language !== i18n.language) {
      i18n.changeLanguage(user.preferred_language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferred_theme, user?.preferred_language]);

  return null;
};

export default PreferencesSync;
