import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvitationPage from './InvitationPage';
import { acceptInvitation, getInvitation } from '../utils/api';

const mockAuth = { user: { email: 'traveler@example.com' }, authLoading: false };

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../utils/api', () => ({ getInvitation: jest.fn(), acceptInvitation: jest.fn() }));

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
