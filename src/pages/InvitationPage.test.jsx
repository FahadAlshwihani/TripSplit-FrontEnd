import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvitationPage from './InvitationPage';
import { acceptInvitation } from '../features/invitations/api/invitationsApi';
import { getJoinCapability, requestInvitationOtp, verifyInvitationOtp } from '../features/join/api/joinApi';

let mockUser = null;
const mockSetUser = jest.fn((user) => { mockUser = user; });
const mockLogout = jest.fn(async () => { mockUser = null; });
const mockSaveProfile = jest.fn(async () => {});

jest.mock('react-i18next', () => {
  const ReactActual = require('react');
  return {
    useTranslation: () => ({
      t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
      i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
    // Minimal stand-in matching AuthPage.test.jsx's — all OtpStep's
    // <Trans> usage needs (renders the key plus the interpolated "email"
    // component cloned with the email text as its child).
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
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: mockUser, authLoading: false, setUser: mockSetUser, saveProfile: mockSaveProfile, logout: mockLogout }) }));
jest.mock('../features/invitations/api/invitationsApi', () => ({ getInvitation: jest.fn(), acceptInvitation: jest.fn() }));
jest.mock('../features/join/api/joinApi', () => ({ getJoinCapability: jest.fn(), requestInvitationOtp: jest.fn(), verifyInvitationOtp: jest.fn() }));

const renderPage = async (entry = '/invite/secrettoken1234567890') => {
  const utils = render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/invite/:token" element={<InvitationPage />} />
        <Route path="/trips/:id/overview" element={<p>trip opened</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>
  );
  await act(async () => {});
  return utils;
};

beforeEach(() => {
  mockUser = null;
  jest.clearAllMocks();
});

test('anonymous email-bound invitation requests and auto-starts the invitation-scoped OTP step', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'needs_email_verification', masked_email: 'i***e@example.com', matches_current_session: null });
  requestInvitationOtp.mockResolvedValue({ otp_id: 42 });
  await renderPage();
  await waitFor(() => expect(requestInvitationOtp).toHaveBeenCalledWith('secrettoken1234567890'));
  expect(await screen.findByText('auth.otp.title')).toBeInTheDocument();
});

test('verifying the OTP signs the user in and accepts once onboarding is already complete', async () => {
  getJoinCapability
    .mockResolvedValueOnce({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'needs_email_verification', masked_email: 'i***e@example.com', matches_current_session: null })
    .mockResolvedValueOnce({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'needs_email_verification', masked_email: 'i***e@example.com', matches_current_session: true });
  requestInvitationOtp.mockResolvedValue({ otp_id: 42 });
  verifyInvitationOtp.mockResolvedValue({ user: { email: 'invitee@example.com', onboarding_complete: true }, is_new_user: false, onboarding_required: false });
  acceptInvitation.mockResolvedValue({ trip: { id: 'trip-1' } });
  await renderPage();
  await screen.findByText('auth.otp.title');

  const cells = screen.getAllByLabelText(/auth\.otp\.label \d/);
  fireEvent.paste(cells[0], { clipboardData: { getData: () => '123456' } });
  fireEvent.click(screen.getByText('auth.otp.verify'));

  await waitFor(() => expect(verifyInvitationOtp).toHaveBeenCalledWith('secrettoken1234567890', { otp_id: 42, code: '123456' }));
  await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('secrettoken1234567890', {}));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});

test('an already-authenticated matching session accepts immediately with no OTP shown', async () => {
  mockUser = { email: 'invitee@example.com' };
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'needs_email_verification', masked_email: 'i***e@example.com', matches_current_session: true });
  acceptInvitation.mockResolvedValue({ trip: { id: 'trip-1' } });
  await renderPage();
  await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('secrettoken1234567890', {}));
  expect(requestInvitationOtp).not.toHaveBeenCalled();
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});

test('a mismatched authenticated session sees a safe wrong-account state, never auto-accepting', async () => {
  mockUser = { email: 'someone-else@example.com' };
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'needs_email_verification', masked_email: 'i***e@example.com', matches_current_session: false });
  await renderPage();
  expect(await screen.findByText('invitation.wrongAccount.title')).toBeInTheDocument();
  expect(acceptInvitation).not.toHaveBeenCalled();

  fireEvent.click(screen.getByText('invitation.wrongAccount.action'));
  await waitFor(() => expect(mockLogout).toHaveBeenCalled());
});

test('an already-member identity sees an Open Trip action instead of the OTP flow', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'already_member', trip_id: 'trip-1' });
  await renderPage();
  expect(await screen.findByText('joinTrip.states.alreadyMember')).toBeInTheDocument();
  fireEvent.click(screen.getByText('joinTrip.openTrip'));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});

test.each([
  ['revoked', 'invitation.revoked'],
  ['expired', 'invitation.expired'],
  ['used', 'invitation.used'],
])('an invalid invitation with reason "%s" shows distinct copy', async (invalid_reason, expectedKey) => {
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'invalid_or_expired_invite', invalid_reason });
  await renderPage();
  expect(await screen.findByText(expectedKey)).toBeInTheDocument();
  expect(acceptInvitation).not.toHaveBeenCalled();
});

test('a guest-invite link (no email required) reuses the Guest Profile Setup onboarding component', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'invitation', trip: { title: 'Georgia' }, action: 'ready_open' });
  acceptInvitation.mockResolvedValue({ trip: { id: 'trip-1' } });
  await renderPage();

  const nameInput = await screen.findByLabelText('profile.setup.displayName');
  fireEvent.change(nameInput, { target: { value: 'Guest Traveler' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));

  await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('secrettoken1234567890', { guest_name: 'Guest Traveler', avatar_type: 'initials', avatar_color: 'indigo' }));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});
