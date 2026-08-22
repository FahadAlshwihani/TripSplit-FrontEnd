import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

test('switching language before requesting the code preserves the entered email', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByText('AR', { selector: 'button' }));
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('nomad@tripsplit.io');
});

test('the standalone OTP card renders real English copy, with the destination email pinned LTR', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Verify your email'));
  expect(document.querySelector('.otp-card__description')).toHaveTextContent('We sent a 6-digit code to nomad@tripsplit.io.');
  const emailToken = document.querySelector('.otp-card__email');
  expect(emailToken).toHaveAttribute('dir', 'ltr');
  expect(emailToken).toHaveTextContent('nomad@tripsplit.io');
});

test('the standalone OTP card renders real Arabic copy after switching language, with the email still pinned LTR', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Verify your email'));

  // The OTP card has no page header/language toggle of its own (matching
  // the approved Stitch reference exactly), so a language switch while on
  // this screen is driven directly here, the way a persisted language
  // preference set elsewhere in the app would apply on arrival. Wrapped in
  // act() because, unlike fireEvent, calling the i18next singleton
  // directly doesn't go through React's own event-batching.
  await act(async () => { await i18n.changeLanguage('ar'); });
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تحقق من بريدك');
  expect(document.querySelector('.otp-card__email')).toHaveAttribute('dir', 'ltr');
  expect(document.querySelector('.otp-card__email')).toHaveTextContent('nomad@tripsplit.io');
});

test('switching language while on the OTP card does not reset already-entered digits', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Verify your email'));

  const cells = screen.getAllByLabelText(/Verification code \d/);
  fireEvent.change(cells[0], { target: { value: '4' } });

  await act(async () => { await i18n.changeLanguage('ar'); });
  const cellsAfter = screen.getAllByLabelText(/رمز التحقق \d/);
  expect(cellsAfter[0]).toHaveValue('4');
});

test('the OTP card remains usable and preserves typed digits under dark theme', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  window.localStorage.setItem('tripsplit:theme', 'dark');
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Verify your email'));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

  const cells = screen.getAllByLabelText(/Verification code \d/);
  fireEvent.change(cells[0], { target: { value: '9' } });
  expect(cells[0]).toHaveValue('9');
});

test('a generic server error renders in real Arabic copy, not English or a raw backend string', async () => {
  requestOtp.mockRejectedValue({ status: 500, code: 'internal_error', message: 'Internal Server Error' });
  await i18n.changeLanguage('ar');
  renderAuth();
  fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('تعذر إرسال رمز التحقق. حاول مرة أخرى.');
  expect(alert).not.toHaveTextContent('Internal Server Error');
});

test('switching language while an error is visible immediately re-renders it in the new language', async () => {
  requestOtp.mockRejectedValue({ status: 500, code: 'internal_error', message: 'Internal Server Error' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't send the verification code. Please try again.");

  fireEvent.click(screen.getByText('AR', { selector: 'button' }));
  expect(screen.getByRole('alert')).toHaveTextContent('تعذر إرسال رمز التحقق. حاول مرة أخرى.');
  // The email itself and the step must be untouched by the language switch.
  expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('nomad@tripsplit.io');
});

test('the send button shows real localized loading copy in English', async () => {
  let resolveRequest;
  requestOtp.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
  renderAuth();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /Send verification code/ }));
  expect(await screen.findByRole('button', { name: /Sending code/ })).toBeInTheDocument();
  resolveRequest({ otp_id: 'otp-1' });
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Verify your email'));
});

test('the send button shows real localized loading copy in Arabic', async () => {
  let resolveRequest;
  requestOtp.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
  await i18n.changeLanguage('ar');
  renderAuth();
  fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /إرسال رمز التحقق/ }));
  expect(await screen.findByRole('button', { name: /جارٍ إرسال الرمز/ })).toBeInTheDocument();
  resolveRequest({ otp_id: 'otp-1' });
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تحقق من بريدك'));
});
