import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { getTrips } from '../../trips/api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../trips/api/tripsApi', () => ({ getTrips: jest.fn() }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: jest.fn() }));

const user = { display_name: 'Fahad', email: 'fahad@example.com', avatar_type: 'initials', avatar_color: 'indigo' };
const mockLogout = jest.fn();

beforeEach(() => {
  useAuth.mockReturnValue({ user, logout: mockLogout });
});

const base = { currency: 'SAR', budget: '100', member_count: 2, current_balance: '0.00', last_activity_at: null };

test('groups trips by active, closed, and archived lifecycle', async () => {
  getTrips.mockResolvedValue({ results: [
    { ...base, id: 'a', title: 'Active Trip', lifecycle_status: 'active', archived_at: null },
    { ...base, id: 'c', title: 'Closed Trip', lifecycle_status: 'closed', archived_at: null },
    { ...base, id: 'x', title: 'Archived Trip', lifecycle_status: 'active', archived_at: '2026-01-01T00:00:00Z' },
  ] });
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(await screen.findByText('Active Trip')).toBeInTheDocument();
  expect(screen.getByText('Closed Trip')).toBeInTheDocument();
  expect(screen.getByText('Archived Trip')).toBeInTheDocument();
});

test('shows the empty state when there are no trips at all', async () => {
  getTrips.mockResolvedValue({ results: [] });
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(await screen.findByText('dashboard.empty.title')).toBeInTheDocument();
  expect(screen.getByText('dashboard.empty.description')).toBeInTheDocument();
});

test('shows the signed-in user identity and a working logout action', async () => {
  getTrips.mockResolvedValue({ results: [] });
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  await screen.findByText('dashboard.empty.title');
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'common.logOut' }));
  expect(mockLogout).toHaveBeenCalledTimes(1);
});

test('Create Trip and Join Trip actions are direct links, not routed through Auth (already authenticated)', async () => {
  getTrips.mockResolvedValue({ results: [] });
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  await screen.findByText('dashboard.empty.title');
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/create-trip');
  expect(screen.getByRole('link', { name: 'home.hero.joinTrip' })).toHaveAttribute('href', '/join-trip');
});
