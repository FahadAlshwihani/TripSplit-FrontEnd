import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeProvider';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

const ThemeSwitch = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  if (!theme) return null;
  const { theme: current, toggleTheme } = theme;
  const isDark = current === 'dark';
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');
  return (
    <button type="button" className="utility-toggle" onClick={toggleTheme} aria-label={label} title={label} aria-pressed={isDark}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

export default ThemeSwitch;
