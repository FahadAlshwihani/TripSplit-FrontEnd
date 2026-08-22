import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../../i18n'; // real i18next singleton — bundled en/ar resources, not mocked
import i18n from '../../../i18n';
import AuthPage from './AuthPage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import LanguageProvider from '../../../components/LanguageProvider';
import { AuthProvider } from '../../../auth/AuthContext';

jest.mock('../api/authApi', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  getCurrentUser: () => Promise.reject(new Error('anonymous')),
  logout: jest.fn(),
  updateProfile: jest.fn(),
}));

beforeEach(async () => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('en');
});

const renderAuth = () => render(<MemoryRouter><LanguageProvider><ThemeProvider><AuthProvider><AuthPage /></AuthProvider></ThemeProvider></LanguageProvider></MemoryRouter>);

test('renders real English copy', () => {
  renderAuth();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in with email');
  expect(screen.getByText('Continue your trip.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue as guest' })).toBeInTheDocument();
});

test('renders real Arabic copy and switches direction to RTL', async () => {
  await i18n.changeLanguage('ar');
  renderAuth();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تسجيل الدخول بالبريد الإلكتروني');
  expect(screen.getByText('كمّل رحلتك.')).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');
});
