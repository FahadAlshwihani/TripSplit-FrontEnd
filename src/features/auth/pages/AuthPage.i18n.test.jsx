import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../../i18n'; // real i18next singleton — bundled en/ar resources, not mocked
import i18n from '../../../i18n';
import AuthPage from './AuthPage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import LanguageProvider from '../../../components/LanguageProvider';
import { AuthProvider } from '../../../auth/AuthContext';
import { requestOtp } from '../api/authApi';

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

test('the Arabic email field stays LTR with the approved LTR placeholder', async () => {
  await i18n.changeLanguage('ar');
  renderAuth();
  const input = screen.getByLabelText('البريد الإلكتروني');
  expect(input.closest('.auth-field__control')).toHaveAttribute('dir', 'ltr');
  expect(input).toHaveAttribute('placeholder', 'you@example.com');
});

test('the Arabic step heading uses the compact headline scale, not the oversized default', async () => {
  await i18n.changeLanguage('ar');
  renderAuth();
  const heading = screen.getByRole('heading', { level: 1 });
  // Regression guard for a real bug this pass found: a typo'd class name
  // (text-headline-md, which doesn't exist) silently fell through to
  // Bootstrap's default h1 styling (40px) instead of the intended 24px/32px
  // scale, most visible as the Arabic heading wrapping to 2-3 oversized
  // lines. Verified visually in-browser that this now renders as one
  // compact line; here we just guard the class name doesn't regress.
  expect(heading).toHaveClass('text-headline');
  expect(heading).not.toHaveClass('text-headline-md');
});

test('switching language mid-flow preserves the entered email and does not reset the OTP step', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByText('AR', { selector: 'button' }));
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('nomad@tripsplit.io');

  fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تحقق من بريدك'));

  fireEvent.click(screen.getByText('EN', { selector: 'button' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Check your email');
  expect(screen.getByText(/We sent a 6-digit verification code to/)).toHaveTextContent('nomad@tripsplit.io');
});
