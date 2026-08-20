import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import SettlementsPanel from './SettlementsPanel';
import { getTrips } from '../features/trips/api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: { first_name: 'Fahad', avatar_key: 'avatar_01' }, authLoading: false, logout: jest.fn() }) }));
jest.mock('../features/trips/api/tripsApi', () => ({ createTrip: jest.fn(), joinTrip: jest.fn(), getTrips: jest.fn() }));

test('groups authenticated trip history by active closed and archived lifecycle', async () => {
  const base = { currency: 'SAR', budget: '100', member_count: 2, current_balance: '0.00', last_activity_at: null };
  getTrips.mockResolvedValue({ results: [
    { ...base, id: 'a', title: 'Active Trip', lifecycle_status: 'active', archived_at: null },
    { ...base, id: 'c', title: 'Closed Trip', lifecycle_status: 'closed', archived_at: null },
    { ...base, id: 'r', title: 'Archived Trip', lifecycle_status: 'active', archived_at: '2026-08-01' },
  ] });
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText('Active Trip')).toBeInTheDocument();
  expect(screen.getByText('Closed Trip')).toBeInTheDocument();
  expect(screen.getByText('Archived Trip')).toBeInTheDocument();
  expect(screen.getByText('trip.group.active')).toBeInTheDocument();
  expect(screen.getByText('trip.group.closed')).toBeInTheDocument();
  expect(screen.getByText('trip.group.archived')).toBeInTheDocument();
});

test('renders the lightweight pending settlement confirmation badge', () => {
  render(<SettlementsPanel members={[]} currency="SAR" settlements={[]} currentMember={{ id: 'me', role: 'member' }} pendingCount={2} onSave={jest.fn()} onDelete={jest.fn()} onReview={jest.fn()} />);
  expect(screen.getByText('2')).toHaveClass('status-badge');
});
