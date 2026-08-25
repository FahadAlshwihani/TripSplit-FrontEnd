import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const trip = { title: 'Georgia Winter Trip', start_date: '2026-12-12', end_date: '2026-12-24', lifecycle_status: 'active', archived_at: null };

const renderSidebar = (permissions, entry = '/trips/t1/overview') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<DashboardSidebar trip={trip} tripId="t1" permissions={permissions} />} />
    </Routes>
  </MemoryRouter>,
);

test('renders every primary nav destination in the canonical order', () => {
  renderSidebar({ canManageMembers: true });
  const labels = screen.getAllByRole('link').map((link) => link.textContent);
  const navLabels = labels.filter((label) => ['dashboard.nav.overview', 'dashboard.nav.expenses', 'dashboard.nav.balances', 'dashboard.nav.fund', 'dashboard.nav.members', 'dashboard.nav.activity', 'dashboard.nav.governance', 'dashboard.nav.settlements'].includes(label));
  expect(navLabels).toEqual(['dashboard.nav.overview', 'dashboard.nav.expenses', 'dashboard.nav.balances', 'dashboard.nav.fund', 'dashboard.nav.members', 'dashboard.nav.activity', 'dashboard.nav.governance', 'dashboard.nav.settlements']);
});

test('Settings and Support stay pinned in the footer, after the primary nav', () => {
  renderSidebar({ canManageMembers: true });
  const labels = screen.getAllByRole('link').map((link) => link.textContent);
  expect(labels.slice(-2)).toEqual(['dashboard.nav.settings', 'dashboard.nav.support']);
});

test('the current route is marked active with the canonical selected state, and only that route', () => {
  renderSidebar({ canManageMembers: true });
  const overviewLink = screen.getByRole('link', { name: 'dashboard.nav.overview' });
  expect(overviewLink).toHaveClass('is-active');
  const expensesLink = screen.getByRole('link', { name: 'dashboard.nav.expenses' });
  expect(expensesLink).not.toHaveClass('is-active');
});

test('Governance is hidden from a member without canManageMembers', () => {
  renderSidebar({ canManageMembers: false });
  expect(screen.queryByRole('link', { name: 'dashboard.nav.governance' })).not.toBeInTheDocument();
});

test('Governance is visible to an owner/admin with canManageMembers', () => {
  renderSidebar({ canManageMembers: true });
  expect(screen.getByRole('link', { name: 'dashboard.nav.governance' })).toBeInTheDocument();
});

test('shows the trip name, date range, and an active-state badge', () => {
  renderSidebar({ canManageMembers: true });
  expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.getByText('dashboard.trip.state.active')).toBeInTheDocument();
});

test('uses the travel/airplane trip identity icon, matching the mobile header', () => {
  renderSidebar({ canManageMembers: true });
  expect(document.querySelector('.dash-sidebar__icon .bi-airplane')).toBeInTheDocument();
  expect(document.querySelector('.dash-sidebar__icon .bi-compass')).not.toBeInTheDocument();
});

test('an archived trip shows the archived badge instead of active', () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/overview']}>
      <Routes>
        <Route path="/trips/:tripId/*" element={<DashboardSidebar trip={{ ...trip, archived_at: '2026-01-01T00:00:00Z' }} tripId="t1" permissions={{ canManageMembers: true }} />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('dashboard.trip.state.archived')).toBeInTheDocument();
});
