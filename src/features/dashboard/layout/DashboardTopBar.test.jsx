import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardTopBar from './DashboardTopBar';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const trip = { title: 'summer' };

const renderTopBar = (permissions = { canManageMembers: true }, entry = '/trips/t1/overview') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<DashboardTopBar trip={trip} tripId="t1" permissions={permissions} />} />
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
  renderTopBar({ canManageMembers: true }, '/trips/t1/expenses');
  expect(screen.getByText('summer')).toBeInTheDocument();
  expect(screen.getByText('dashboard.nav.expenses')).toBeInTheDocument();
  expect(screen.queryByText('dashboard.nav.overview')).not.toBeInTheDocument();
});

test('the trip name is rendered verbatim, never translated or reformatted', () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/settings']}>
      <Routes>
        <Route path="/trips/:tripId/*" element={<DashboardTopBar trip={{ title: 'Georgia Winter Trip' }} tripId="t1" permissions={{ canManageMembers: true }} />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.getByText('dashboard.nav.settings')).toBeInTheDocument();
});

test('Add Member is a real secondary control -- explicit secondary class, never bare/undeclared', () => {
  renderTopBar();
  const addMember = screen.getByRole('button', { name: 'dashboard.addMember' });
  expect(addMember).toHaveClass('dash-btn', 'dash-btn--secondary');
});

test('Quick Expense is the primary elevated action', () => {
  renderTopBar();
  const quickExpense = screen.getByRole('button', { name: 'dashboard.quickExpense' });
  expect(quickExpense).toHaveClass('dash-btn', 'dash-btn--primary');
});

test('Add Member is hidden entirely for a member without canManageMembers', () => {
  renderTopBar({ canManageMembers: false });
  expect(screen.queryByRole('button', { name: 'dashboard.addMember' })).not.toBeInTheDocument();
});
