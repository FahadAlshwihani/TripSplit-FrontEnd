import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MobileDashboardHeader from './MobileDashboardHeader';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const user = { display_name: 'Fahad', email: 'fahad@example.com', preferred_theme: 'light', preferred_language: 'en', avatar_type: 'initials', avatar_color: 'indigo' };
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user, saveProfile: jest.fn(), logout: jest.fn() }) }));
jest.mock('../../../components/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', setTheme: jest.fn() }) }));

const trip = {
  title: 'summer',
  start_date: '2026-08-25',
  end_date: '2026-08-30',
  lifecycle_status: 'active',
  archived_at: null,
  current_member: { identity_type: 'registered' },
};

const renderHeader = (props = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<MobileDashboardHeader trip={trip} tripId="t1" permissions={{ canManageMembers: true }} {...props} />} />
      <Route path="/account" element={<p>account page</p>} />
    </Routes>
  </MemoryRouter>,
);

test('leads with trip identity, not the TripSplit wordmark', () => {
  renderHeader();
  expect(screen.getByText('summer')).toBeInTheDocument();
  expect(screen.queryByText('TripSplit')).not.toBeInTheDocument();
  expect(screen.queryByText('home.nav.brand')).not.toBeInTheDocument();
});

test('shows the trip date range, readable alongside the title', () => {
  renderHeader();
  expect(screen.getByText('Aug 25, 2026 – Aug 30, 2026')).toBeInTheDocument();
});

test('does not render a status badge -- travel icon, trip title, and dates are enough', () => {
  renderHeader();
  expect(screen.queryByText('dashboard.trip.state.active')).not.toBeInTheDocument();
  expect(document.querySelector('.dash-mobile-header__badge')).not.toBeInTheDocument();
});

test('exposes two obvious quick actions -- New Expense and Add Member -- each with a real accessible name', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: 'dashboard.newExpense' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'dashboard.addMember' })).toBeInTheDocument();
});

test('Add Member is hidden for a member without canManageMembers -- still only one other quick action remains, never zero', () => {
  renderHeader({ permissions: { canManageMembers: false } });
  expect(screen.queryByRole('button', { name: 'dashboard.addMember' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'dashboard.newExpense' })).toBeInTheDocument();
});

test('the trip identity link keeps its full accessible name (title), not just a generic "switch trip" label', () => {
  renderHeader();
  const link = screen.getByRole('link', { name: /summer/ });
  expect(link).toHaveAttribute('href', '/account');
});

test('a guest (non-registered) current member gets no trip-switch link -- guests are scoped to one trip', () => {
  renderHeader({ trip: { ...trip, current_member: { identity_type: 'guest' } } });
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText('summer')).toBeInTheDocument();
});
