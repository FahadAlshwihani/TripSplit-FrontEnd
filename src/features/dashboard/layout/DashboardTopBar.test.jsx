import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardTopBar from './DashboardTopBar';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const trip = { title: 'summer' };
const quickActions = {
  state: null,
  capabilities: { expense: true, member: true, fundingRound: true },
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onSelect: jest.fn(),
};

const renderTopBar = (entry = '/trips/t1/overview') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<DashboardTopBar trip={trip} tripId="t1" quickActions={quickActions} />} />
    </Routes>
  </MemoryRouter>,
);

test('shows a compact "trip name / current page" context title instead of the TripSplit wordmark', () => {
  renderTopBar();
  expect(screen.getByText('summer')).toBeInTheDocument();
  expect(screen.getByText('dashboard.nav.overview')).toBeInTheDocument();
  expect(screen.queryByText('home.nav.brand')).not.toBeInTheDocument();
});

test('the context title updates to the current route label as the active route changes', () => {
  renderTopBar('/trips/t1/expenses');
  expect(screen.getByText('summer')).toBeInTheDocument();
  expect(screen.getByText('dashboard.nav.expenses')).toBeInTheDocument();
  expect(screen.queryByText('dashboard.nav.overview')).not.toBeInTheDocument();
});

test('the trip name is rendered verbatim, never translated or reformatted', () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/settings']}>
      <Routes>
        <Route path="/trips/:tripId/*" element={<DashboardTopBar trip={{ title: 'Georgia Winter Trip' }} tripId="t1" quickActions={quickActions} />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.getByText('dashboard.nav.settings')).toBeInTheDocument();
});

test('uses the shared Quick Actions launcher instead of duplicate create shortcuts', () => {
  renderTopBar();
  const launcher = screen.getByRole('button', { name: 'dashboard.quickActions' });
  expect(launcher).toHaveClass('dash-btn', 'dash-btn--primary', 'dash-quick-actions__trigger');
  expect(screen.queryByRole('button', { name: 'dashboard.addMember' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'dashboard.quickExpense' })).not.toBeInTheDocument();
});
