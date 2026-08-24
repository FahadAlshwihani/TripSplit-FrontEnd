import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PreferencesSync from './PreferencesSync';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';

jest.mock('react-i18next', () => {
  const changeLanguage = jest.fn().mockImplementation(function fakeChangeLanguage(lang) { this.language = lang; });
  const i18n = { language: 'en', changeLanguage };
  return { useTranslation: () => ({ i18n }), __mockI18n: i18n };
});

let mockUser = null;
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

const Probe = () => {
  const { theme } = useTheme();
  return <p>theme: {theme}</p>;
};

beforeEach(() => {
  mockUser = null;
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  jest.clearAllMocks();
});

test('does nothing while anonymous', () => {
  render(<ThemeProvider><PreferencesSync /><Probe /></ThemeProvider>);
  expect(screen.getByText('theme: light')).toBeInTheDocument();
});

test('server preferred_theme overrides a locally cached value once the profile resolves', async () => {
  window.localStorage.setItem('tripsplit:theme', 'light');
  mockUser = { preferred_theme: 'dark', preferred_language: 'en' };
  render(<ThemeProvider><PreferencesSync /><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByText('theme: dark')).toBeInTheDocument());
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});

test('server preferred_language triggers changeLanguage when it differs from the current one', async () => {
  const { __mockI18n } = require('react-i18next');
  mockUser = { preferred_theme: 'light', preferred_language: 'ar' };
  render(<ThemeProvider><PreferencesSync /><Probe /></ThemeProvider>);
  await waitFor(() => expect(__mockI18n.changeLanguage).toHaveBeenCalledWith('ar'));
});

test('does not call changeLanguage when the language already matches', async () => {
  const { __mockI18n } = require('react-i18next');
  mockUser = { preferred_theme: 'light', preferred_language: 'en' };
  render(<ThemeProvider><PreferencesSync /><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByText('theme: light')).toBeInTheDocument());
  expect(__mockI18n.changeLanguage).not.toHaveBeenCalled();
});
