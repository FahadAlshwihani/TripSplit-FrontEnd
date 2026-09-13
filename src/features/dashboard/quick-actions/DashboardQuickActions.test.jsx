import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DashboardShell from '../layout/DashboardShell';
import { addExpense } from '../../expenses/api/expensesApi';
import { createInvitation } from '../../invitations/api/invitationsApi';
import { createFundingRound, getFund } from '../../funds/api/fundsApi';
import { getMembers } from '../../members/api/membersApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('../../expenses/api/expensesApi', () => ({ addExpense: jest.fn() }));
jest.mock('../../categories/api/categoriesApi', () => ({
  getCategories: jest.fn(() => Promise.resolve({ results: [] })),
  getCategoryBudgets: jest.fn(() => Promise.resolve({ results: [] })),
}));
jest.mock('../../members/api/membersApi', () => ({
  getMembers: jest.fn(() => Promise.resolve({ results: [{ id: 'member-1', active: true }] })),
}));
jest.mock('../../funds/api/fundsApi', () => ({
  getFund: jest.fn(() => Promise.resolve({ id: 'fund-1', status: 'active' })),
  createFundingRound: jest.fn(),
}));
jest.mock('../../invitations/api/invitationsApi', () => ({ createInvitation: jest.fn() }));

jest.mock('../../expenses/components/NewExpenseDialog', () => ({ onSubmit, onClose }) => (
  <div role="dialog" aria-label="canonical expense dialog">
    <button type="button" onClick={() => onSubmit({ title: 'Taxi', amount: '20.00' })}>submit expense</button>
    <button type="button" onClick={onClose}>close expense</button>
  </div>
));
jest.mock('../../governance/components/InviteMemberDialog', () => ({ onInvite, onClose }) => (
  <div role="dialog" aria-label="canonical member dialog">
    <button type="button" onClick={() => onInvite({ email: 'friend@example.com' }).then(onClose)}>submit member</button>
  </div>
));
jest.mock('../../funds/components/FundingRoundComposer', () => ({ onSubmit, onClose }) => (
  <div role="dialog" aria-label="canonical funding round dialog">
    <button type="button" onClick={() => onSubmit({ title: 'Top up', target_amount: '100.00' })}>submit round</button>
    <button type="button" onClick={onClose}>close round</button>
  </div>
));

const trip = {
  id: 'trip-uuid',
  short_code: 't1',
  title: 'Summer',
  currency: 'SAR',
  current_member: { id: 'member-1', identity_type: 'registered' },
  governance_capabilities: { can_invite: true },
};
const permissions = { canCreateExpense: true, canManageMembers: true };

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="pathname">{location.pathname}</output>;
}

const renderShell = (overrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <DashboardShell
      trip={{ ...trip, ...overrides.trip }}
      tripId="t1"
      currentMember={trip.current_member}
      permissions={{ ...permissions, ...overrides.permissions }}
    >
      <LocationProbe />
    </DashboardShell>
  </MemoryRouter>,
);

const openDesktopMenu = () => {
  const launcher = screen.getAllByRole('button', { name: 'dashboard.quickActions' })[0];
  fireEvent.click(launcher);
  return launcher;
};

beforeEach(() => {
  jest.clearAllMocks();
  addExpense.mockResolvedValue({});
  createInvitation.mockResolvedValue({});
  createFundingRound.mockResolvedValue({});
  getMembers.mockResolvedValue({ results: [{ id: 'member-1', active: true }] });
  getCategories.mockResolvedValue({ results: [] });
  getCategoryBudgets.mockResolvedValue({ results: [] });
  getFund.mockResolvedValue({ id: 'fund-1', status: 'active' });
});

test('mobile shell has no profile control or duplicate Add Member shortcut, while Settings remains reachable', () => {
  renderShell();
  expect(document.querySelector('.account-menu')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'dashboard.addMember' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /dashboard.nav.settings/ }).length).toBeGreaterThan(0);
});

test('Add Expense opens the canonical composer without navigation or a page-level loader', async () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsExpense' }));

  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  await waitFor(() => expect(getMembers).toHaveBeenCalledWith('trip-uuid', expect.objectContaining({ signal: expect.any(AbortSignal) })));
  expect(await screen.findByRole('dialog', { name: 'canonical expense dialog' }, { timeout: 1000 })).toBeInTheDocument();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/trips/t1/overview');
  expect(document.querySelector('.neo-loading')).not.toBeInTheDocument();
  expect(screen.getAllByRole('dialog')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'submit expense' }));
  await waitFor(() => expect(addExpense).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('Add Member opens the canonical invitation dialog and preserves the current route', async () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsMember' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(await screen.findByRole('dialog', { name: 'canonical member dialog' })).toBeInTheDocument();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/trips/t1/overview');

  fireEvent.click(screen.getByRole('button', { name: 'submit member' }));
  await waitFor(() => expect(createInvitation).toHaveBeenCalledWith('trip-uuid', { email: 'friend@example.com' }));
});

test('New Funding Round opens the canonical Fund composer without route navigation', async () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsFundingRound' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  await waitFor(() => expect(getFund).toHaveBeenCalledWith('trip-uuid', expect.objectContaining({ signal: expect.any(AbortSignal) })));
  expect(await screen.findByRole('dialog', { name: 'canonical funding round dialog' }, { timeout: 1000 })).toBeInTheDocument();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/trips/t1/overview');

  fireEvent.click(screen.getByRole('button', { name: 'submit round' }));
  await waitFor(() => expect(createFundingRound).toHaveBeenCalledWith('trip-uuid', { title: 'Top up', target_amount: '100.00' }));
});

test('server-derived capabilities remove unavailable member and funding actions', () => {
  renderShell({ trip: { governance_capabilities: { can_invite: false } }, permissions: { canManageMembers: false } });
  openDesktopMenu();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsExpense' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsMember' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsFundingRound' })).not.toBeInTheDocument();
});
