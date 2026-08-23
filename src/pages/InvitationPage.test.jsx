import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvitationPage from './InvitationPage';
import { acceptInvitation, getInvitation } from '../features/invitations/api/invitationsApi';

const mockAuth = { user: { email: 'traveler@example.com' }, authLoading: false };

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../features/invitations/api/invitationsApi', () => ({ getInvitation: jest.fn(), acceptInvitation: jest.fn() }));

afterEach(() => { jest.clearAllMocks(); });

test('resumes and accepts an email invitation after authentication', async () => {
  getInvitation.mockResolvedValue({ valid: true, email_required: true, trip_title: 'Georgia' });
  acceptInvitation.mockResolvedValue({ trip: { id: 'trip-1' } });
  render(<MemoryRouter initialEntries={['/invite/secret']}><Routes><Route path="/invite/:token" element={<InvitationPage />} /><Route path="/trip/:id" element={<p>trip opened</p>} /></Routes></MemoryRouter>);
  await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('secret', {}));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});

test('shows invalid invitation state without accepting', async () => {
  getInvitation.mockResolvedValue({ valid: false, email_required: false, trip_title: 'Georgia' });
  render(<MemoryRouter initialEntries={['/invite/expired']}><Routes><Route path="/invite/:token" element={<InvitationPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText('invite.invalid')).toBeInTheDocument();
  expect(acceptInvitation).not.toHaveBeenCalled();
});

test('a guest-invite link (no email required) reuses the Guest Profile Setup onboarding component', async () => {
  getInvitation.mockResolvedValue({ valid: true, email_required: false, trip_title: 'Georgia' });
  acceptInvitation.mockResolvedValue({ trip: { id: 'trip-1' } });
  render(<MemoryRouter initialEntries={['/invite/guestlink']}><Routes><Route path="/invite/:token" element={<InvitationPage />} /><Route path="/trip/:id" element={<p>trip opened</p>} /></Routes></MemoryRouter>);

  const nameInput = await screen.findByLabelText('profile.setup.displayName');
  fireEvent.change(nameInput, { target: { value: 'Guest Traveler' } });
  fireEvent.click(screen.getByRole('button', { name: 'profile.setup.finish' }));

  await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('guestlink', { guest_name: 'Guest Traveler', avatar_type: 'initials', avatar_color: 'indigo' }));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});
