import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage';
import OtpStep from '../components/OtpStep';
import { requestOtp, verifyOtp } from '../api/authApi';

jest.mock('react-i18next', () => {
  const ReactActual = require('react');
  return {
    useTranslation: () => ({
      t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
      i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
    // Minimal stand-in: renders the key plus the interpolated "email"
    // component (cloned with the email text as its child), which is all
    // OtpStep's <Trans> usage needs from this mock.
    Trans: ({ i18nKey, values, components }) => {
      const emailEl = components?.email;
      return ReactActual.createElement(
        ReactActual.Fragment,
        null,
        i18nKey,
        emailEl ? ReactActual.cloneElement(emailEl, {}, values?.email) : null,
      );
    },
  };
});
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

const advanceToOtp = async (email = 'nomad@tripsplit.io') => {
  requestOtp.mockResolvedValue({ otp_id: 'otp-1' });
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.otp.title'));
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

test('renders the local editorial book image in the mobile-only composition on the email step', () => {
  renderAuth();
  const mobileImage = document.querySelector('.auth-mobile-visual__image');
  expect(mobileImage).toBeInTheDocument();
  expect(mobileImage.tagName).toBe('IMG');
  expect(mobileImage.getAttribute('src')).toBeTruthy();
  expect(mobileImage.getAttribute('src')).not.toMatch(/^https?:\/\//);
});

test('the standalone OTP card has no editorial image and no page header — it is a compact, dedicated screen', async () => {
  renderAuth();
  await advanceToOtp();
  expect(document.querySelector('.auth-mobile-visual__image')).not.toBeInTheDocument();
  expect(document.querySelector('.auth-context__image')).not.toBeInTheDocument();
  expect(document.querySelector('.auth-header')).not.toBeInTheDocument();
  expect(document.querySelector('.otp-card')).toBeInTheDocument();
});

test('rejects an invalid email without calling the API', () => {
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'not-an-email' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('auth.errors.invalidEmail');
  expect(requestOtp).not.toHaveBeenCalled();
});

test('submitting a valid email requests a code and advances to the OTP step', async () => {
  renderAuth();
  await advanceToOtp();
  expect(requestOtp).toHaveBeenCalledWith('nomad@tripsplit.io');
});

test('a known backend error code renders its localized message, never the raw backend text', async () => {
  requestOtp.mockRejectedValue({ status: 429, code: 'rate_limited', message: 'Too many requests from this IP, slow down.' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('auth.errors.rateLimited');
  expect(alert).not.toHaveTextContent('Too many requests from this IP');
});

test('a network failure (no backend response) renders the localized network error, not raw error.message', async () => {
  requestOtp.mockRejectedValue({ status: 0, code: 'network_error', message: 'Network Error' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('auth.errors.network');
  expect(alert).not.toHaveTextContent('Network Error');
});

test('an unrecognized/server error falls back to the contextual request-failed key, not raw error.message', async () => {
  requestOtp.mockRejectedValue({ status: 500, code: 'internal_error', message: 'Traceback (most recent call last)...' });
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  fireEvent.click(screen.getByRole('button', { name: /auth.email.submit/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('auth.errors.requestFailed');
  expect(alert).not.toHaveTextContent('Traceback');
});

test('the send button shows loading copy and a spinner while sending, and returns to idle after failure', async () => {
  let rejectRequest;
  requestOtp.mockReturnValue(new Promise((_resolve, reject) => { rejectRequest = reject; }));
  renderAuth();
  fireEvent.change(screen.getByLabelText('auth.email.label'), { target: { value: 'nomad@tripsplit.io' } });
  const submitButton = screen.getByRole('button', { name: /auth.email.submit/ });
  fireEvent.click(submitButton);

  const loadingButton = await screen.findByRole('button', { name: /auth\.email\.sending/ });
  expect(loadingButton).toHaveClass('auth-btn--loading');
  expect(loadingButton).toBeDisabled();
  expect(loadingButton.querySelector('.auth-spinner')).toBeInTheDocument();

  // A second click while the request is in flight must not fire a duplicate request.
  fireEvent.click(loadingButton);
  expect(requestOtp).toHaveBeenCalledTimes(1);

  rejectRequest({ status: 500, code: 'internal_error', message: 'boom' });
  await waitFor(() => expect(screen.getByRole('button', { name: /auth\.email\.submit/ })).not.toBeDisabled());
  expect(screen.getByRole('alert')).toHaveTextContent('auth.errors.requestFailed');
  // Still on the email step: failure must not advance to OTP.
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('the OTP card shows the destination email pinned to LTR, six empty cells, and the LTR-isolated cell group', async () => {
  renderAuth();
  await advanceToOtp('nomad@tripsplit.io');

  const emailToken = document.querySelector('.otp-card__email');
  expect(emailToken).toHaveTextContent('nomad@tripsplit.io');
  expect(emailToken).toHaveAttribute('dir', 'ltr');

  const cells = screen.getAllByLabelText(/auth\.otp\.label \d/);
  expect(cells).toHaveLength(6);
  cells.forEach((cell) => expect(cell).toHaveValue(''));

  const group = document.querySelector('.otp-cells');
  expect(group).toHaveAttribute('dir', 'ltr');
  expect(group).toHaveAttribute('aria-label', 'auth.otp.label');
});

test('OTP entry auto-advances focus and Backspace returns to the previous cell', async () => {
  renderAuth();
  await advanceToOtp();
  const cells = screen.getAllByLabelText(/auth\.otp\.label \d/);

  fireEvent.change(cells[0], { target: { value: '1' } });
  expect(cells[1]).toHaveFocus();

  fireEvent.change(cells[1], { target: { value: '2' } });
  expect(cells[2]).toHaveFocus();

  fireEvent.keyDown(cells[2], { key: 'Backspace' });
  expect(cells[1]).toHaveFocus();
});

test('pasting a full 6-digit code distributes it across all cells and focuses the last one', async () => {
  renderAuth();
  await advanceToOtp();
  const cells = screen.getAllByLabelText(/auth\.otp\.label \d/);

  const clipboardData = { getData: () => '246826' };
  fireEvent.paste(cells[0], { clipboardData });

  cells.forEach((cell, index) => expect(cell).toHaveValue('246826'[index]));
  expect(cells[5]).toHaveFocus();
});

test('verifying a correct 6-digit code signs the user in and returns to the safe next destination', async () => {
  verifyOtp.mockResolvedValue({ user: { id: 'u1' }, onboarding_required: false });
  renderAuth('/auth?next=%2Fcreate-trip');
  await advanceToOtp();
  fillOtp('123456');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.verify/ }));
  await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ otp_id: 'otp-1', email: 'nomad@tripsplit.io', code: '123456' }));
  expect(mockSetUser).toHaveBeenCalledWith({ id: 'u1' });
  expect(await screen.findByText('create-trip-page')).toBeInTheDocument();
});

test('a new registrant sees the profile step before continuing', async () => {
  verifyOtp.mockResolvedValue({ user: { id: 'u2' }, onboarding_required: true });
  renderAuth();
  await advanceToOtp();
  fillOtp('123456');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.verify/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('profile.setup.title'));
});

const advanceToProfile = async () => {
  verifyOtp.mockResolvedValue({ user: { id: 'u2' }, onboarding_required: true });
  await advanceToOtp();
  fillOtp('123456');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.verify/ }));
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('profile.setup.title'));
};

test('completing profile setup saves the structured avatar payload and continues to the preserved next destination', async () => {
  mockSaveProfile.mockResolvedValue({ id: 'u2', display_name: 'Alex Smith', avatar_type: 'initials', avatar_color: 'indigo' });
  renderAuth('/auth?next=%2Fcreate-trip');
  await advanceToProfile();
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Alex Smith' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ display_name: 'Alex Smith', avatar_type: 'initials', avatar_color: 'indigo' }));
  await screen.findByText('create-trip-page');
});

test('a validation-error response from PATCH /profile/ renders the generic localized save-failure copy, never raw backend field errors', async () => {
  mockSaveProfile.mockRejectedValue({ status: 400, code: 'validation_error', message: 'Please correct the highlighted fields.', fields: { avatar_style: ['Select a supported avatar style.'] } });
  renderAuth();
  await advanceToProfile();
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Alex Smith' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('profile.setup.errors.saveFailed');
  expect(alert).not.toHaveTextContent('avatar_style');
});

test('a network failure while saving the profile renders the network-specific error copy', async () => {
  mockSaveProfile.mockRejectedValue({ status: 0, code: 'network_error', message: 'Network request failed' });
  renderAuth();
  await advanceToProfile();
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Alex Smith' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('profile.setup.errors.network');
});

test('an invalid-OTP backend code renders its localized message from the OTP-card namespace, never the raw backend text', async () => {
  verifyOtp.mockRejectedValue({ status: 400, code: 'otp_invalid', message: 'OTP code mismatch for otp_id=otp-1' });
  renderAuth();
  await advanceToOtp();
  fillOtp('000000');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.verify/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('auth.otp.errors.invalid');
  expect(alert).not.toHaveTextContent('otp_id=otp-1');
});

test('the verify button shows loading copy and a spinner while verifying, and returns to idle after failure', async () => {
  let rejectVerify;
  verifyOtp.mockReturnValue(new Promise((_resolve, reject) => { rejectVerify = reject; }));
  renderAuth();
  await advanceToOtp();
  fillOtp('000000');
  fireEvent.click(screen.getByRole('button', { name: /auth.otp.verify/ }));

  const loadingButton = await screen.findByRole('button', { name: /auth\.otp\.verifying/ });
  expect(loadingButton).toHaveClass('auth-btn--loading');
  expect(loadingButton.querySelector('.auth-spinner')).toBeInTheDocument();
  expect(verifyOtp).toHaveBeenCalledTimes(1);

  rejectVerify({ status: 400, code: 'otp_expired', message: 'expired' });
  await waitFor(() => expect(screen.getByRole('button', { name: /auth\.otp\.verify/ })).toBeInTheDocument());
  expect(screen.getByRole('alert')).toHaveTextContent('auth.otp.errors.expired');
});

test('resend is disabled during the cooldown, showing a zero-padded countdown, distinct from the loading state', async () => {
  renderAuth();
  await advanceToOtp();
  const cooldownButton = screen.getByRole('button', { name: /auth\.otp\.resendCountdown/ });
  expect(cooldownButton).toBeDisabled();
  expect(cooldownButton).not.toHaveClass('otp-resend--loading');
  expect(cooldownButton).toHaveTextContent(/\d{2}:\d{2}/);
});

test('resend shows loading copy and a spinner while a resend request is in flight', () => {
  // Exercised directly against OtpStep (bypassing AuthPage's real 60s
  // cooldown timer) — this is a pure rendering contract for the
  // isResending prop, already wired correctly by resendCode in AuthPage.jsx.
  render(
    <OtpStep
      email="nomad@tripsplit.io"
      isVerifying={false}
      isResending
      errorKey={null}
      resendSeconds={0}
      onSubmit={jest.fn()}
      onResend={jest.fn()}
      onBack={jest.fn()}
    />
  );
  const loadingResend = screen.getByRole('button', { name: /auth\.otp\.resending/ });
  expect(loadingResend).toHaveClass('otp-resend--loading');
  expect(loadingResend.querySelector('.auth-spinner')).toBeInTheDocument();
  expect(loadingResend).toBeDisabled();
});

test('continue as guest shows Guest Profile Setup, then navigates to the safe next destination with gateway state', async () => {
  renderAuth('/auth?next=%2Fcreate-trip');
  fireEvent.click(screen.getByRole('button', { name: 'auth.guest.action' }));
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.guest.action');
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Guest Traveler' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));
  expect(await screen.findByText('create-trip-page')).toBeInTheDocument();
});

test('an unsafe next destination falls back to home after guest profile setup', async () => {
  renderAuth('/auth?next=https%3A%2F%2Fevil.example.com');
  fireEvent.click(screen.getByRole('button', { name: 'auth.guest.action' }));
  fireEvent.change(await screen.findByLabelText('profile.setup.displayName'), { target: { value: 'Guest Traveler' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));
  expect(await screen.findByText('home-page')).toBeInTheDocument();
});

test('guest=0 hides guest continuation and explains sign-in is required', () => {
  renderAuth('/auth?next=%2Finvite%2Ftok123&guest=0');
  expect(screen.queryByRole('button', { name: 'auth.guest.action' })).not.toBeInTheDocument();
  expect(screen.getByText('auth.invitation.signInRequired')).toBeInTheDocument();
});

test('the icon-only back button returns to the email step', async () => {
  renderAuth();
  await advanceToOtp();
  fireEvent.click(screen.getByRole('button', { name: 'auth.otp.back' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});
