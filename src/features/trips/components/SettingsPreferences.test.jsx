import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingsPreferences from './SettingsPreferences';

const mockI18nChangeLanguage = jest.fn();
let mockI18nLanguage = 'en';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: mockI18nLanguage, changeLanguage: mockI18nChangeLanguage },
  }),
}));

let mockAuthUser = null;
let mockAuthLoading = false;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, isAuthenticated: Boolean(mockAuthUser), authLoading: mockAuthLoading }) }));

const mockSetTheme = jest.fn();
let mockThemeValue = 'light';
jest.mock('../../../components/ThemeProvider', () => ({ useTheme: () => ({ theme: mockThemeValue, setTheme: mockSetTheme }) }));

const mockChangeLanguage = jest.fn();
const mockChangeTheme = jest.fn();
jest.mock('../../account/hooks/usePreferenceSave', () => () => ({ status: {}, changeLanguage: mockChangeLanguage, changeTheme: mockChangeTheme }));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = null;
  mockAuthLoading = false;
  mockI18nLanguage = 'en';
  mockThemeValue = 'light';
});

test('a registered user sees their canonical preferred_language/preferred_theme, not local i18n/theme state', () => {
  mockAuthUser = { preferred_language: 'ar', preferred_theme: 'dark' };
  render(<SettingsPreferences />);
  expect(screen.getByLabelText('settings.preferences.language')).toHaveValue('ar');
  expect(screen.getByLabelText('settings.preferences.theme')).toHaveValue('dark');
});

test('changing language as a registered user goes through the shared usePreferenceSave hook', () => {
  mockAuthUser = { preferred_language: 'en', preferred_theme: 'light' };
  render(<SettingsPreferences />);
  fireEvent.change(screen.getByLabelText('settings.preferences.language'), { target: { value: 'ar' } });
  expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
  expect(mockI18nChangeLanguage).not.toHaveBeenCalled();
});

test('changing theme as a registered user goes through the shared usePreferenceSave hook', () => {
  mockAuthUser = { preferred_language: 'en', preferred_theme: 'light' };
  render(<SettingsPreferences />);
  fireEvent.change(screen.getByLabelText('settings.preferences.theme'), { target: { value: 'dark' } });
  expect(mockChangeTheme).toHaveBeenCalledWith('dark');
  expect(mockSetTheme).not.toHaveBeenCalled();
});

test('a guest with no profile reads the existing local i18n/theme state, never a fake preference', () => {
  mockI18nLanguage = 'ar';
  mockThemeValue = 'dark';
  render(<SettingsPreferences />);
  expect(screen.getByLabelText('settings.preferences.language')).toHaveValue('ar');
  expect(screen.getByLabelText('settings.preferences.theme')).toHaveValue('dark');
});

test('a guest changing language/theme uses the same local primitives ThemeSwitch/LanguageSwitch already use, never usePreferenceSave', () => {
  render(<SettingsPreferences />);
  fireEvent.change(screen.getByLabelText('settings.preferences.language'), { target: { value: 'ar' } });
  fireEvent.change(screen.getByLabelText('settings.preferences.theme'), { target: { value: 'dark' } });
  expect(mockI18nChangeLanguage).toHaveBeenCalledWith('ar');
  expect(mockSetTheme).toHaveBeenCalledWith('dark');
  expect(mockChangeLanguage).not.toHaveBeenCalled();
  expect(mockChangeTheme).not.toHaveBeenCalled();
});

test('while auth is still resolving, only the Preferences card shows a local loading placeholder -- never the whole page', () => {
  mockAuthLoading = true;
  const { container } = render(<SettingsPreferences />);
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('holds no trip-local language/theme draft state of its own (structural: no useState in the component)', () => {
  const source = fs.readFileSync(path.join(__dirname, 'SettingsPreferences.jsx'), 'utf8');
  expect(source).not.toMatch(/useState/);
});
