import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DashboardShell from '../layout/DashboardShell';
import { addExpense } from '../../expenses/api/expensesApi';
import { createInvitation } from '../../invitations/api/invitationsApi';
import { createFundingRound, getFund } from '../../funds/api/fundsApi';
import { getMembers } from '../../members/api/membersApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { recordAdminSettlement } from '../../settlements/api/settlementsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
const mockChangeLanguage = jest.fn();
const mockChangeTheme = jest.fn();
jest.mock('../../account/hooks/usePreferenceControls', () => () => ({
  language: 'en', theme: 'light', changeLanguage: mockChangeLanguage, changeTheme: mockChangeTheme, status: {}, authLoading: false, isAuthenticated: true,
}));
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
jest.mock('../../settlements/api/settlementsApi', () => ({ recordAdminSettlement: jest.fn() }));

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
jest.mock('../../settlements/components/SettlementActionDialog', () => ({ onSave, onClose }) => (
  <div role="dialog" aria-label="canonical settlement dialog">
    <button type="button" onClick={() => onSave({ from_member_id: 'member-1', to_member_id: 'member-2', amount: '10.00' })}>submit settlement</button>
    <button type="button" onClick={onClose}>close settlement</button>
  </div>
));
jest.mock('../../support/components/SupportTicketDialog', () => ({ onClose }) => (
  <div role="dialog" aria-label="canonical support dialog"><button type="button" onClick={onClose}>close support</button></div>
));

const trip = {
  id: 'trip-uuid',
  short_code: 't1',
  title: 'Summer',
  currency: 'SAR',
  current_member: { id: 'member-1', identity_type: 'registered' },
  governance_capabilities: { can_invite: true },
};
const permissions = { canCreateExpense: true, canManageMembers: true, canManageFund: true, canRecordAdminSettlement: true };

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
  recordAdminSettlement.mockResolvedValue({});
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

test('Record Settlement opens the canonical admin settlement dialog and saves without navigation', async () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSettlement' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(await screen.findByRole('dialog', { name: 'canonical settlement dialog' })).toBeInTheDocument();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/trips/t1/overview');
  fireEvent.click(screen.getByRole('button', { name: 'submit settlement' }));
  await waitFor(() => expect(recordAdminSettlement).toHaveBeenCalledTimes(1));
});

test('Report a Problem opens the canonical support form wrapper without navigation', async () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSupport' }));
  expect(await screen.findByRole('dialog', { name: 'canonical support dialog' })).toBeInTheDocument();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/trips/t1/overview');
});

test('My Account navigates directly to the canonical account route', () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'dashboard.quickActionsAccount' }));
  expect(screen.getByTestId('pathname')).toHaveTextContent('/account');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('theme and language controls use the canonical preference adapter', () => {
  renderShell();
  openDesktopMenu();
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'account.preferences.themeDark' }));
  expect(mockChangeTheme).toHaveBeenCalledWith('dark');
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'العربية' }));
  expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
});

test('server-derived and semantic capabilities remove unavailable privileged actions', () => {
  renderShell({ trip: { governance_capabilities: { can_invite: false } }, permissions: { canManageMembers: false, canManageFund: false, canRecordAdminSettlement: false } });
  openDesktopMenu();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsExpense' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsMember' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsFundingRound' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsSettlement' })).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSupport' })).toBeInTheDocument();
});
