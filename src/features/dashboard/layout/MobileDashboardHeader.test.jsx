import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MobileDashboardHeader from './MobileDashboardHeader';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

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
  const dateRange = document.querySelector('.dash-mobile-header__trip-dates');
  expect(dateRange).toBeInTheDocument();
  expect(dateRange).not.toBeEmptyDOMElement();
  expect(dateRange).toHaveTextContent('–');
});

test('does not render a status badge -- travel icon, trip title, and dates are enough', () => {
  renderHeader();
  expect(screen.queryByText('dashboard.trip.state.active')).not.toBeInTheDocument();
  expect(document.querySelector('.dash-mobile-header__badge')).not.toBeInTheDocument();
});

test('keeps one compact creation action and removes the dashboard account entry point', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: 'dashboard.newExpense' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'dashboard.addMember' })).not.toBeInTheDocument();
  expect(document.querySelector('.account-menu')).not.toBeInTheDocument();
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
