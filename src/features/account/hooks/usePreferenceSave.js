import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../components/ThemeProvider';

/*
  The ONE canonical place a registered user's preferred_theme/
  preferred_language/preferred_currency get saved from -- shared by the
  Account page's Preferences card AND the authenticated nav's account
  dropdown, so there is no second nav-only preference state drifting
  from the server-authoritative one. Every save applies its visible side
  effect (theme attribute, i18n language) OPTIMISTICALLY, then rolls it
  back if the PATCH fails, so the UI never keeps pretending a save
  succeeded when the server rejected it.
*/
export default function usePreferenceSave() {
  const { saveProfile } = useAuth();
  const theme = useTheme();
  const { i18n } = useTranslation();
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

  return { status, changeLanguage, changeTheme, changeCurrency };
}
