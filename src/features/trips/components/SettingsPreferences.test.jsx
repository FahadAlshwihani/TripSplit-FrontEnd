import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingsPreferences from './SettingsPreferences';

const mockChangeLanguage = jest.fn();
const mockChangeTheme = jest.fn();
let mockPreferences;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('../../account/hooks/usePreferenceControls', () => () => mockPreferences);

beforeEach(() => {
  jest.clearAllMocks();
  mockPreferences = {
    language: 'en',
    theme: 'light',
    changeLanguage: mockChangeLanguage,
    changeTheme: mockChangeTheme,
    authLoading: false,
  };
});

test('renders the canonical preference-control values', () => {
  mockPreferences = { ...mockPreferences, language: 'ar', theme: 'dark' };
  render(<SettingsPreferences />);
  expect(screen.getByLabelText('settings.preferences.language')).toHaveValue('ar');
  expect(screen.getByLabelText('settings.preferences.theme')).toHaveValue('dark');
});

test('changing language uses the shared preference-control path', () => {
  render(<SettingsPreferences />);
  fireEvent.change(screen.getByLabelText('settings.preferences.language'), { target: { value: 'ar' } });
  expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
});

test('changing theme uses the shared preference-control path', () => {
  render(<SettingsPreferences />);
  fireEvent.change(screen.getByLabelText('settings.preferences.theme'), { target: { value: 'dark' } });
  expect(mockChangeTheme).toHaveBeenCalledWith('dark');
});

test('while auth is still resolving, only the Preferences card shows a local loading placeholder -- never the whole page', () => {
  mockPreferences = { ...mockPreferences, authLoading: true };
  const { container } = render(<SettingsPreferences />);
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('holds no trip-local language/theme draft state of its own (structural: no useState in the component)', () => {
  const source = fs.readFileSync(path.join(__dirname, 'SettingsPreferences.jsx'), 'utf8');
  expect(source).not.toMatch(/useState/);
});
