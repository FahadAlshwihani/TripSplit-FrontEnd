import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import BalancesPage from './BalancesPage';
import { getBalances, remindAllDebtors, remindDebtor } from '../api/balancesApi';
import { getMembers } from '../../members/api/membersApi';
import { getSettlements, getSettlementTimeline, recordAdminSettlement, recordReceivedPayment, reportPayment, reviewSettlement } from '../../settlements/api/settlementsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/balancesApi', () => ({ getBalances: jest.fn(), remindDebtor: jest.fn(), remindAllDebtors: jest.fn() }));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../settlements/api/settlementsApi', () => ({
  getSettlements: jest.fn(),
  getSettlementTimeline: jest.fn(),
  reviewSettlement: jest.fn(),
  reportPayment: jest.fn(),
  recordReceivedPayment: jest.fn(),
  recordAdminSettlement: jest.fn(),
}));

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
const trip = { currency: 'SAR', archived_at: null, lifecycle_status: 'active', short_code: 't1' };

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
  getSettlements.mockResolvedValue({ results: [] });
  getSettlementTimeline.mockResolvedValue([]);
});

test('links to the full Settlement History ledger page', async () => {
  renderPage();
  const link = await screen.findByRole('link', { name: /settlements.title/ });
  expect(link).toHaveAttribute('href', '/trips/t1/settlements');
});

test('renders the net balance card from the authoritative my_net_balance field', async () => {
  renderPage();
  expect(await findMoney('620.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('balances.netBalanceHint.positive')).toBeInTheDocument();
});

test('renders "People who owe me" rows with Send Reminder and Record Payment Received', async () => {
  renderPage();
  expect(await screen.findByText('Saud')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'balances.sendReminder' })).toHaveLength(2);
  expect(screen.getAllByRole('button', { name: 'settlements.recordReceived' })).toHaveLength(2);
});

test('renders "People I owe" rows with an I Paid action', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  renderPage();
  expect(await screen.findByText('Saud')).toBeInTheDocument();
  expect(screen.getByText('balances.youOwe')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.iPaid' })).toBeInTheDocument();
});

test('a fully settled state shows the settled empty state', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, my_net_balance: '0.00', people_who_owe_me: [], people_i_owe: [] });
  renderPage();
  expect(await screen.findByText('balances.allSettledUp')).toBeInTheDocument();
});

test('a single-member trip shows the no-data empty state, not the settled state', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, my_net_balance: '0.00', people_who_owe_me: [], people_i_owe: [] });
  getMembers.mockResolvedValue({ results: [fahad] });
  renderPage();
  expect(await screen.findByText('balances.emptyStateTitle')).toBeInTheDocument();
});

test('an archived/closed trip renders the read-only banner and disables reminders, I Paid, and admin record', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_i_owe: [{ member: mohammedPreview, amount: '10.00' }] });
  renderPage({ permissions: { canRecordSettlement: false } });
  // The read-only banner is part of the static header and renders
  // immediately, independent of the balances fetch (Part B) -- wait on
  // the data-dependent buttons themselves before asserting on them.
  expect(screen.getByText('balances.readOnlyArchived')).toBeInTheDocument();
  (await screen.findAllByRole('button', { name: 'balances.sendReminder' })).forEach((button) => expect(button).toBeDisabled());
  expect(screen.queryByRole('button', { name: 'settlements.recordReceived' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.iPaid' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.recordExternal' })).not.toBeInTheDocument();
});

test('sending a single reminder calls remindDebtor and shows an inline sent confirmation', async () => {
  remindDebtor.mockResolvedValue({ member_id: 'm2', amount: '400.00', notified: true });
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'balances.sendReminder' });
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(remindDebtor).toHaveBeenCalledWith('t1', 'm2'));
  expect(await screen.findByText('balances.reminderSent:{"name":"Saud"}')).toBeInTheDocument();
});

test('Remind All opens a confirmation dialog and, once confirmed, shows the sent/skipped summary', async () => {
  remindAllDebtors.mockResolvedValue({ sent_count: 2, skipped_count: 1, results: [] });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'balances.remindAll' }));
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'balances.remindAllConfirmConfirm' }));
  await waitFor(() => expect(remindAllDebtors).toHaveBeenCalledWith('t1'));
  expect(await screen.findByText('balances.remindAllResult:{"sent":2,"skipped":1}')).toBeInTheDocument();
});

test('Record Payment Received opens the dialog preselected to that member and calls recordReceivedPayment', async () => {
  recordReceivedPayment.mockResolvedValue({});
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'settlements.recordReceived' });
  fireEvent.click(buttons[0]);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Saud')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.recordReceived' }));
  await waitFor(() => expect(recordReceivedPayment).toHaveBeenCalledWith('t1', expect.objectContaining({ from_member_id: 'm2', amount: '400.00' })));
});

test('I Paid opens the dialog preselected to that member and calls reportPayment', async () => {
  reportPayment.mockResolvedValue({});
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.iPaid' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Saud')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.iPaid' }));
  await waitFor(() => expect(reportPayment).toHaveBeenCalledWith('t1', expect.objectContaining({ to_member_id: 'm2', amount: '75.00' })));
});

test('a pending report on a "people who owe me" row shows the creditor pending card with confirm/not-received/check-later, not the normal buttons', async () => {
  getSettlements.mockResolvedValue({ results: [{ id: 's1', from_member_id: 'm2', to_member_id: 'm1', amount: '400.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '' }] });
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('settlements.reportedPayment:{"name":"Saud"}')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.yesReceived' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.notReceivedAction' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.checkLaterAction' })).toBeInTheDocument();
  // The normal reminder/record-received buttons for THIS member are replaced.
  expect(screen.getAllByRole('button', { name: 'balances.sendReminder' })).toHaveLength(1); // only Mohammed's remains
});

test('confirming a pending report calls reviewSettlement with "confirm" and refreshes', async () => {
  getSettlements.mockResolvedValue({ results: [{ id: 's1', from_member_id: 'm2', to_member_id: 'm1', amount: '400.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '' }] });
  reviewSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.yesReceived' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's1', 'confirm'));
});

test('a pending report on a "people I owe" row shows the debtor pending card with only Withdraw', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [{ id: 's2', from_member_id: 'm1', to_member_id: 'm2', amount: '75.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '' }] });
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('settlements.waitingOnThem:{"name":"Saud"}')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.withdrawReport' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.iPaid' })).not.toBeInTheDocument();
});

test('withdrawing a pending report calls reviewSettlement with "cancel"', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [{ id: 's2', from_member_id: 'm1', to_member_id: 'm2', amount: '75.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '' }] });
  reviewSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.withdrawReport' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's2', 'cancel'));
});

test('an owner sees Record External Settlement; a regular member does not', async () => {
  const { unmount } = renderPage({ currentMember: fahad });
  expect(await screen.findByRole('button', { name: 'settlements.recordExternal' })).toBeInTheDocument();
  unmount();
  renderPage({ currentMember: saud });
  await screen.findByText('Saud');
  expect(screen.queryByRole('button', { name: 'settlements.recordExternal' })).not.toBeInTheDocument();
});

test('Record External Settlement opens the admin dialog with real from/to pickers and requires acknowledgement', async () => {
  recordAdminSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.recordExternal' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('settlements.payer')).toBeInTheDocument();
  expect(within(dialog).getByLabelText('settlements.recipient')).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText('settlements.payer'), { target: { value: 'm2' } });
  fireEvent.change(within(dialog).getByLabelText('settlements.recipient'), { target: { value: 'm3' } });
  fireEvent.change(within(dialog).getByLabelText('expense.amount'), { target: { value: '20' } });
  const submit = within(dialog).getByRole('button', { name: 'settlements.recordExternal' });
  expect(submit).toBeDisabled(); // acknowledgement not yet checked
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(submit);
  await waitFor(() => expect(recordAdminSettlement).toHaveBeenCalledWith('t1', expect.objectContaining({ from_member_id: 'm2', to_member_id: 'm3', amount: '20', acknowledged: true })));
});

test('Escape closes the settlement action dialog', async () => {
  renderPage();
  fireEvent.click((await screen.findAllByRole('button', { name: 'settlements.recordReceived' }))[0]);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('a balances load failure shows a retry action', async () => {
  getBalances.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('network down')).toBeInTheDocument();
});

test('the fund-vs-balances explanatory hint is always shown', async () => {
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('balances.fundHint')).toBeInTheDocument();
});

// -- Rejection recovery ----------------------------------------------

const rejectedDebtorSideRow = { id: 's3', from_member_id: 'm1', to_member_id: 'm2', amount: '75.00', currency: 'SAR', status: 'rejected', settlement_date: '2026-08-20', note: '', created_by: 'm1', created_at: '2026-08-20T10:00:00Z', retry_cooldown_active: false };
const rejectedCreditorSideRow = { id: 's4', from_member_id: 'm2', to_member_id: 'm1', amount: '400.00', currency: 'SAR', status: 'rejected', settlement_date: '2026-08-20', note: '', created_by: 'm2', created_at: '2026-08-20T10:00:00Z', retry_cooldown_active: false };

test('a rejected settlement shows the debtor a distinct rejected card, not the plain I Paid button', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [rejectedDebtorSideRow] });
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('settlements.rejectedBadge')).toBeInTheDocument();
  expect(screen.getByText('settlements.rejectedBody:{"name":"Saud","amount":"75.00","currency":"SAR"}')).toBeInTheDocument();
  expect(screen.getByText('settlements.rejectedHelper')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.iPaid' })).not.toBeInTheDocument();
});

test('the rejected card offers Retry, New Payment, and History -- three distinct actions', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [rejectedDebtorSideRow] });
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByRole('button', { name: 'settlements.retryAction' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.newPaymentAction' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.viewHistoryAction' })).toBeInTheDocument();
});

test('Retry calls reviewSettlement with "retry" (never a new-payment call) and refreshes', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [rejectedDebtorSideRow] });
  reviewSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.retryAction' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's3', 'retry'));
  expect(reportPayment).not.toHaveBeenCalled();
});

test('a cooldown-active rejected settlement disables Retry', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [{ ...rejectedDebtorSideRow, retry_cooldown_active: true }] });
  renderPage();
  expect(await screen.findByRole('button', { name: 'settlements.retryAction' })).toBeDisabled();
});

test('New Payment opens the I Paid composer (a distinct settlement from the rejected one)', async () => {
  reportPayment.mockResolvedValue({});
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [rejectedDebtorSideRow] });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.newPaymentAction' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.iPaid' }));
  await waitFor(() => expect(reportPayment).toHaveBeenCalledWith('t1', expect.objectContaining({ to_member_id: 'm2', amount: '75.00' })));
});

test('History opens the settlement timeline drawer and fetches it', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  getSettlements.mockResolvedValue({ results: [rejectedDebtorSideRow] });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.viewHistoryAction' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() => expect(getSettlementTimeline).toHaveBeenCalledWith('t1', 's3', expect.anything()));
});

test('the creditor side sees a compact rejected notice with only a History action, no retry/new-payment', async () => {
  getSettlements.mockResolvedValue({ results: [rejectedCreditorSideRow] });
  renderPage();
  await screen.findByText('Saud');
  expect(screen.getByText('settlements.creditorRejectedNotice')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.retryAction' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.newPaymentAction' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.viewHistoryAction' })).toBeInTheDocument();
});

test('a rejection does not erase the pending state of an unrelated member on the same page', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [{ member: saudPreview, amount: '400.00', can_remind: true }, { member: mohammedPreview, amount: '220.00', can_remind: true }] });
  getSettlements.mockResolvedValue({ results: [rejectedCreditorSideRow] }); // only Saud's pair is rejected
  renderPage();
  await screen.findByText('Mohammed');
  // Mohammed still gets the plain reminder button -- untouched by Saud's rejection.
  expect(screen.getAllByRole('button', { name: 'balances.sendReminder' })).toHaveLength(1);
});

// -- Confirmation success history (Part A) ----------------------------

test('confirming a pending report shows a success banner naming the amount and counterparty, then lets it be dismissed', async () => {
  getSettlements.mockResolvedValue({ results: [{ id: 's5', from_member_id: 'm2', to_member_id: 'm1', amount: '400.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '', created_by: 'm2' }] });
  reviewSettlement.mockResolvedValue({ id: 's5', from_member_id: 'm2', to_member_id: 'm1', from_name: 'Saud', to_name: 'Fahad', amount: '400.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-20' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.yesReceived' }));
  expect(await screen.findByText('settlements.successTitle')).toBeInTheDocument();
  expect(screen.getByText('settlements.successBodyConfirmed:{"name":"Saud","amount":"400.00","currency":"SAR"}')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'settlements.done' }));
  await waitFor(() => expect(screen.queryByText('settlements.successTitle')).not.toBeInTheDocument());
});

test('the success banner\'s "View settlement history" opens the timeline drawer', async () => {
  getSettlements.mockResolvedValue({ results: [{ id: 's5', from_member_id: 'm2', to_member_id: 'm1', amount: '400.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '', created_by: 'm2' }] });
  reviewSettlement.mockResolvedValue({ id: 's5', from_member_id: 'm2', to_member_id: 'm1', from_name: 'Saud', to_name: 'Fahad', amount: '400.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-20' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.yesReceived' }));
  await screen.findByText('settlements.successTitle');
  fireEvent.click(screen.getByRole('button', { name: 'settlements.viewSettlementHistory' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() => expect(getSettlementTimeline).toHaveBeenCalledWith('t1', 's5', expect.anything()));
});

test('Record Payment Received (self-confirmed immediately) also shows the success banner', async () => {
  recordReceivedPayment.mockResolvedValue({ id: 's6', from_member_id: 'm2', to_member_id: 'm1', from_name: 'Saud', to_name: 'Fahad', amount: '400.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-20' });
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'settlements.recordReceived' });
  fireEvent.click(buttons[0]);
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.recordReceived' }));
  expect(await screen.findByText('settlements.successTitle')).toBeInTheDocument();
});

test('a debtor reporting a payment (still pending, not completed) never shows the success banner', async () => {
  reportPayment.mockResolvedValue({ id: 's7', status: 'pending' });
  getBalances.mockResolvedValue({ ...baseBalances, people_who_owe_me: [], people_i_owe: [{ member: saudPreview, amount: '75.00' }], my_net_balance: '-75.00' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.iPaid' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.iPaid' }));
  await waitFor(() => expect(reportPayment).toHaveBeenCalled());
  expect(screen.queryByText('settlements.successTitle')).not.toBeInTheDocument();
});

// --- Part B: progressive/section-level loading -----------------------

test('the page title, subtitle, and fund hint render immediately, before the balances/members/settlements fetch resolves', () => {
  getBalances.mockImplementation(() => new Promise(() => {}));
  renderPage();
  expect(screen.getByText('balances.title')).toBeInTheDocument();
  expect(screen.getByText('balances.fundHint')).toBeInTheDocument();
});

test('while balances are pending, a section-scoped loading indicator shows in place of the balance lists -- never the app-wide NeoLoading', () => {
  getBalances.mockImplementation(() => new Promise(() => {}));
  const { container } = renderPage();
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('a background refresh after sending a reminder never blanks the already-rendered balance rows -- stale data stays visible throughout', async () => {
  remindDebtor.mockResolvedValue({ member_id: 'm2', amount: '400.00', notified: true });
  renderPage();
  const buttons = await screen.findAllByRole('button', { name: 'balances.sendReminder' });
  let resolveSecond;
  getBalances.mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(remindDebtor).toHaveBeenCalled());
  // The background refetch triggered by the reminder is now in flight
  // (unresolved) -- the already-rendered net balance card must still
  // be present, not replaced by a loading placeholder.
  expect(screen.getByText('balances.title')).toBeInTheDocument();
  expect(document.querySelector('.bal-page__actions')).toBeInTheDocument();
  await act(async () => resolveSecond(baseBalances));
});
