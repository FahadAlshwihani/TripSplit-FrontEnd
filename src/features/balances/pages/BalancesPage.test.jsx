import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import BalancesPage from './BalancesPage';
import { getBalances, remindAllDebtors, remindDebtor } from '../api/balancesApi';
import { getMembers } from '../../members/api/membersApi';
import { addSettlement } from '../../settlements/api/settlementsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/balancesApi', () => ({ getBalances: jest.fn(), remindDebtor: jest.fn(), remindAllDebtors: jest.fn() }));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../settlements/api/settlementsApi', () => ({ addSettlement: jest.fn() }));

const fahad = { id: 'm1', display_name: 'Fahad', role: 'owner', active: true, avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', role: 'member', active: true, avatar: { type: 'initials', color: 'slate' } };
const mohammed = { id: 'm3', display_name: 'Mohammed', role: 'member', active: true, avatar: { type: 'initials', color: 'green' } };

const saudPreview = { member_id: 'm2', display_name: 'Saud', role: 'member', avatar: { type: 'initials', color: 'slate' } };
const mohammedPreview = { member_id: 'm3', display_name: 'Mohammed', role: 'member', avatar: { type: 'initials', color: 'green' } };

const baseBalances = {
  currency: 'SAR',
  members: [],
  suggested_settlements: [],
  my_net_balance: '620.00',
  owed_to_me_total: '620.00',
  i_owe_total: '0.00',
  people_who_owe_me: [
    { member: saudPreview, amount: '400.00', can_remind: true },
    { member: mohammedPreview, amount: '220.00', can_remind: true },
  ],
  people_i_owe: [],
};

const permissions = { canRecordSettlement: true };
const trip = { currency: 'SAR', archived_at: null, lifecycle_status: 'active' };

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/balances']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions, ...ctxOverrides }} />}>
        <Route path="balances" element={<BalancesPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);
const findMoney = (text) => screen.findByText(moneyMatcher(text));

beforeEach(() => {
  jest.clearAllMocks();
  getBalances.mockResolvedValue(baseBalances);
  getMembers.mockResolvedValue({ results: [fahad, saud, mohammed] });
});

test('renders the net balance card from the authoritative my_net_balance field', async () => {
  renderPage();
  expect(await findMoney('620.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('balances.netBalanceHint.positive')).toBeInTheDocument();
});

test('a negative net balance shows the negative hint', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, my_net_balance: '-150.00', people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '150.00' }] });
  renderPage();
  await findMoney('150.00 SAR');
  expect(screen.getByText('balances.netBalanceHint.negative')).toBeInTheDocument();
});

test('renders "People who owe me" rows with amount, relationship copy, and a reminder button', async () => {
  renderPage();
  expect(await screen.findByText('Saud')).toBeInTheDocument();
  expect(screen.getByText('Mohammed')).toBeInTheDocument();
  expect(screen.getAllByText('balances.owesYou')).toHaveLength(2);
  expect(await findMoney('400.00 SAR')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'balances.sendReminder' })).toHaveLength(2);
});

test('renders "People I owe" rows with a Settle action, not a reminder button', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  renderPage();
  expect(await screen.findByText('Saud')).toBeInTheDocument();
  expect(screen.getByText('balances.youOwe')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.record' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'balances.sendReminder' })).not.toBeInTheDocument();
});

test('a mixed state renders both sections', async () => {
  getBalances.mockResolvedValue({
    ...baseBalances,
    people_who_owe_me: [{ member: saudPreview, amount: '400.00', can_remind: true }],
    people_i_owe: [{ member: mohammedPreview, amount: '220.00' }],
  });
  renderPage();
  expect(await screen.findByText('balances.peopleWhoOweMe')).toBeInTheDocument();
  expect(screen.getByText('balances.peopleIOwe')).toBeInTheDocument();
});

test('a fully settled state (both lists empty, other members present) shows the settled empty state', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, my_net_balance: '0.00', people_who_owe_me: [], people_i_owe: [] });
  renderPage();
  expect(await screen.findByText('balances.allSettledUp')).toBeInTheDocument();
});

test('a single-member trip (no one else to owe or be owed) shows the no-data empty state, not the settled state', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, my_net_balance: '0.00', people_who_owe_me: [], people_i_owe: [] });
  getMembers.mockResolvedValue({ results: [fahad] });
  renderPage();
  expect(await screen.findByText('balances.emptyStateTitle')).toBeInTheDocument();
  expect(screen.queryByText('balances.allSettledUp')).not.toBeInTheDocument();
});

test('an archived/closed trip renders the read-only banner, disables reminders, and hides Remind All / Settle', async () => {
  renderPage({ permissions: { canRecordSettlement: false } });
  expect(await screen.findByText('balances.readOnlyArchived')).toBeInTheDocument();
  const reminderButtons = screen.getAllByRole('button', { name: 'balances.sendReminder' });
  reminderButtons.forEach((button) => expect(button).toBeDisabled());
  expect(screen.queryByRole('button', { name: 'balances.remindAll' })).not.toBeInTheDocument();
});

test('an archived/closed trip hides the Settle action on a row I owe', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }] });
  renderPage({ permissions: { canRecordSettlement: false } });
  await screen.findByText('Saud');
  expect(screen.queryByRole('button', { name: 'settlements.record' })).not.toBeInTheDocument();
});

test('sending a single reminder calls remindDebtor and shows an inline sent confirmation', async () => {
  remindDebtor.mockResolvedValue({ member_id: 'm2', amount: '400.00', notified: true });
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'balances.sendReminder' });
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(remindDebtor).toHaveBeenCalledWith('t1', 'm2'));
  expect(await screen.findByText('balances.reminderSent:{"name":"Saud"}')).toBeInTheDocument();
});

test('a reminder rejected with reminder_cooldown shows the cooldown copy, not a generic error', async () => {
  remindDebtor.mockRejectedValue({ code: 'reminder_cooldown', message: 'A reminder was sent to this member recently.' });
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'balances.sendReminder' });
  fireEvent.click(buttons[0]);
  expect(await screen.findByText('balances.reminderCooldown')).toBeInTheDocument();
});

test('a row with can_remind: false disables the reminder button up front, before any click', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [{ member: saudPreview, amount: '400.00', can_remind: false }] });
  renderPage();
  const button = await screen.findByRole('button', { name: 'balances.sendReminder' });
  expect(button).toBeDisabled();
});

test('Remind All opens a confirmation dialog before sending anything', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'balances.remindAll' }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(remindAllDebtors).not.toHaveBeenCalled();
});

test('confirming Remind All calls remindAllDebtors and shows the sent/skipped summary', async () => {
  remindAllDebtors.mockResolvedValue({ sent_count: 2, skipped_count: 1, results: [] });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'balances.remindAll' }));
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'balances.remindAllConfirmConfirm' }));
  await waitFor(() => expect(remindAllDebtors).toHaveBeenCalledWith('t1'));
  expect(await screen.findByText('balances.remindAllResult:{"sent":2,"skipped":1}')).toBeInTheDocument();
});

test('cancelling the Remind All dialog does not call remindAllDebtors', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'balances.remindAll' }));
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'balances.remindAllConfirmCancel' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(remindAllDebtors).not.toHaveBeenCalled();
});

test('Record Settlement preselects the row\'s counterpart member and calls addSettlement', async () => {
  addSettlement.mockResolvedValue({});
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.record' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('settlements.to').value).toBe('m2');
  fireEvent.change(within(dialog).getByLabelText('expense.amount'), { target: { value: '75' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.record' }));
  await waitFor(() => expect(addSettlement).toHaveBeenCalledWith('t1', expect.objectContaining({ from_member_id: 'm1', to_member_id: 'm2', amount: '75' })));
});

test('Escape closes the Record Settlement dialog', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }] });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.record' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('a balances load failure shows a retry action', async () => {
  getBalances.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('network down')).toBeInTheDocument();
});

test('the fund-vs-balances explanatory hint is always shown, and no Fund contribution rows ever appear on this page', async () => {
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('balances.fundHint')).toBeInTheDocument();
  expect(screen.queryByText(/fund/i, { selector: '.bal-row__name' })).not.toBeInTheDocument();
});
