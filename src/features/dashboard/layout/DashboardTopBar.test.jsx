import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardTopBar from './DashboardTopBar';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderTopBar = (permissions = { canManageMembers: true }) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<DashboardTopBar tripId="t1" permissions={permissions} />} />
    </Routes>
  </MemoryRouter>,
);

test('the TripSplit wordmark uses a real typography class (not a nonexistent one that would silently fall back to default browser text)', () => {
  renderTopBar();
  const brand = screen.getByText('home.nav.brand');
  expect(brand).toHaveClass('text-headline');
  expect(brand).not.toHaveClass('text-headline-md');
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
