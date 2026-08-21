import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { getTrips } from '../features/trips/api/tripsApi';

const mockUser = { first_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01', preferred_language: 'en', preferred_currency: 'SAR' };
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: mockUser, authLoading: false, saveProfile: jest.fn() }) }));
jest.mock('../features/trips/api/tripsApi', () => ({ getTrips: jest.fn() }));
jest.mock('../features/auth/api/authApi', () => ({ requestEmailChange: jest.fn(), verifyEmailChange: jest.fn() }));

test('groups authenticated trip history by active closed and archived lifecycle', async () => {
  const base = { currency: 'SAR', budget: '100', member_count: 2, current_balance: '0.00', last_activity_at: null };
  getTrips.mockResolvedValue({ results: [
    { ...base, id: 'a', title: 'Active Trip', lifecycle_status: 'active', archived_at: null },
    { ...base, id: 'c', title: 'Closed Trip', lifecycle_status: 'closed', archived_at: null },
    { ...base, id: 'r', title: 'Archived Trip', lifecycle_status: 'active', archived_at: '2026-08-01' },
  ] });
  render(<MemoryRouter><ProfilePage /></MemoryRouter>);
  expect(await screen.findByText('Active Trip')).toBeInTheDocument();
  expect(screen.getByText('Closed Trip')).toBeInTheDocument();
  expect(screen.getByText('Archived Trip')).toBeInTheDocument();
  expect(screen.getByText('trip.group.active')).toBeInTheDocument();
  expect(screen.getByText('trip.group.closed')).toBeInTheDocument();
  expect(screen.getByText('trip.group.archived')).toBeInTheDocument();
});

test('still uses the legacy MainLayout background — proves it is scoped there, not deleted app-wide', async () => {
  getTrips.mockResolvedValue({ results: [] });
  render(<MemoryRouter><ProfilePage /></MemoryRouter>);
  await screen.findByText('trip.empty.active');
  expect(document.querySelector('.area')).toBeInTheDocument();
  expect(document.querySelector('.circles')).toBeInTheDocument();
});
