import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage';
import { requestOtp, verifyOtp } from '../api/authApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/authApi', () => ({ requestOtp: jest.fn(), verifyOtp: jest.fn() }));

const mockSetUser = jest.fn();
const mockSaveProfile = jest.fn();
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: null, authLoading: false, setUser: mockSetUser, saveProfile: mockSaveProfile, logout: jest.fn() }) }));

const renderAuth = (entry = '/auth') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/create-trip" element={<p>create-trip-page</p>} />
      <Route path="/" element={<p>home-page</p>} />
    </Routes>
  </MemoryRouter>
);

const fillOtp = (code) => {
  const cells = screen.getAllByLabelText(/auth\.otp\.label \d/);
  code.split('').forEach((digit, index) => fireEvent.change(cells[index], { target: { value: digit } }));
};

afterEach(() => { jest.clearAllMocks(); });

test('renders the email step by default', () => {
  renderAuth();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
  expect(screen.getByLabelText('auth.email.label')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'auth.guest.action' })).toBeInTheDocument();
});

test('the email field control is pinned to LTR regardless of page direction', () => {
  renderAuth();
  const input = screen.getByLabelText('auth.email.label');
  expect(input.closest('.auth-field__control')).toHaveAttribute('dir', 'ltr');
});

test('renders exactly one guest control, with the back link and accessible helper alongside it', () => {
  renderAuth();
  const guestButtons = screen.getAllByRole('button', { name: /auth\.guest\.action/ });
  expect(guestButtons).toHaveLength(1);
  const guestButton = guestButtons[0];
  expect(guestButton).toHaveClass('auth-guest-action');
  expect(guestButton).toHaveAttribute('aria-describedby', 'auth-guest-helper');
  expect(document.getElementById('auth-guest-helper')).toHaveTextContent('auth.guest.helper');
  expect(screen.getByRole('link', { name: /auth\.backToHome/ })).toBeInTheDocument();
});

test('renders the local editorial book image, not a placeholder or remote URL', () => {
  renderAuth();
  const image = document.querySelector('.auth-context__image');
  expect(image).toBeInTheDocument();
  expect(image.tagName).toBe('IMG');
  expect(image.getAttribute('src')).toBeTruthy();
  expect(image.getAttribute('src')).not.toMatch(/^https?:\/\//);
  expect(document.querySelector('.auth-context__visual-inner svg')).not.toBeInTheDocument();
});

test('rejects an invalid email without calling the API', () => {
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'not-an-email' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('auth.email.invalid');
  expect(requestOtp).not.toHaveBeenCalled();
});

test('submitting a valid email requests a code and advances to the OTP step', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  expect(requestOtp).toHaveBeenCalledWith('nomad@tripsplit.io');
});

test('shows the backend error message when the OTP request fails', async () => {
  requestOtp.mockRejectedValue({ response: { data: { message: 'Too many requests.' } } });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests.');
});

test('verifying a correct 6-digit code signs the user in and returns to the safe next destination', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  verifyOtp.mockResolvedValue({ user: { id: 'u1' }, onboarding_required: false });
  renderAuth('/auth?next=%2Fcreate-trip');
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  fillOtp('123456');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.submit/ }));
  await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ otp_id: 'otp-1', email: 'nomad@tripsplit.io', code: '123456' }));
  expect(mockSetUser).toHaveBeenCalledWith({ id: 'u1' });
  expect(await screen.findByText('create-trip-page')).toBeInTheDocument();
});

test('a new registrant sees the profile step before continuing', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  verifyOtp.mockResolvedValue({ user: { id: 'u2' }, onboarding_required: true });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  fillOtp('123456');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.profile.heading'));
});

test('shows the backend error message when verification fails', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  verifyOtp.mockRejectedValue({ response: { data: { message: "That code isn't correct." } } });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  fillOtp('000000');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.submit/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent("That code isn't correct.");
});

test('continue as guest navigates to the safe next destination with gateway state', async () => {
  renderAuth('/auth?next=%2Fcreate-trip');
  fireEvent.click(screen.getByRole('button', { name: 'auth.guest.action' }));
  expect(await screen.findByText('create-trip-page')).toBeInTheDocument();
});

test('an unsafe next destination falls back to home', async () => {
  renderAuth('/auth?next=https%3A%2F%2Fevil.example.com');
  fireEvent.click(screen.getByRole('button', { name: 'auth.guest.action' }));
  expect(await screen.findByText('home-page')).toBeInTheDocument();
});

test('guest=0 hides guest continuation and explains sign-in is required', () => {
  renderAuth('/auth?next=%2Finvite%2Ftok123&guest=0');
  expect(screen.queryByRole('button', { name: 'auth.guest.action' })).not.toBeInTheDocument();
  expect(screen.getByText('auth.invitation.signInRequired')).toBeInTheDocument();
});

test('resend is disabled immediately after a code is requested', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  expect(screen.getByRole('button', { name: /auth\.otp\.resendCooldown/ })).toBeDisabled();
});

test('"Use a different email" returns to the email step', async () => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.heading'));
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.changeEmail/ }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});
