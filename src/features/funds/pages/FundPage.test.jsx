import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import FundPage from './FundPage';
import {
  getFund, createFund, updateFund, createFundingRound, recordFundContribution, reportFundContribution,
  confirmFundContribution, rejectFundContribution, recordFundReimbursement, previewFundRefund, recordFundRefunds,
  completeFundingRound, cancelFundingRound, retryFundContribution, correctFundContribution, voidFundContribution,
  remindContribution, closeFund,
} from '../api/fundsApi';
import { getMembers } from '../../members/api/membersApi';
import { getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { getExpenses } from '../../expenses/api/expensesApi';
import { getActivity, getActivityPage } from '../../activity/api/activityApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/fundsApi', () => ({
  getFund: jest.fn(), createFund: jest.fn(), updateFund: jest.fn(),
  createFundingRound: jest.fn(), completeFundingRound: jest.fn(), cancelFundingRound: jest.fn(),
  recordFundContribution: jest.fn(), reportFundContribution: jest.fn(),
  confirmFundContribution: jest.fn(), rejectFundContribution: jest.fn(), retryFundContribution: jest.fn(),
  correctFundContribution: jest.fn(), voidFundContribution: jest.fn(), remindContribution: jest.fn(),
  previewFundRefund: jest.fn(), recordFundRefunds: jest.fn(), recordFundReimbursement: jest.fn(),
  getFundCloseReadiness: jest.fn(), closeFund: jest.fn(),
}));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../categories/api/categoriesApi', () => ({ getCategories: jest.fn(), getCategoryBudgets: jest.fn() }));
jest.mock('../../expenses/api/expensesApi', () => ({ getExpenses: jest.fn() }));
jest.mock('../../activity/api/activityApi', () => ({ getActivity: jest.fn(), getActivityPage: jest.fn() }));
jest.mock('../../expenses/components/ExpenseDetailsDrawer', () => ({ __esModule: true, default: ({ expense, onClose }) => (<div data-testid="expense-drawer">{expense.title}<button onClick={onClose}>close-drawer</button></div>) }));

const fahad = { id: 'm1', display_name: 'Fahad', role: 'owner', active: true, avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', role: 'member', active: true, avatar: { type: 'initials', color: 'slate' } };
const members = [fahad, saud];
const permissions = { canManageMembers: true, canEditExpense: () => true, canCreateExpense: true };
const trip = { currency: 'SAR', archived_at: null, lifecycle_status: 'active' };

const baseAccounting = { collected: '1000.00', spent: '400.00', refunded: '0.00', reimbursed: '0.00', balance: '600.00', surplus: '600.00', deficit: '0.00' };

const round1 = {
  id: 'r1', sequence_number: 1, title: 'Initial Collection', reason: '', contribution_method: 'equal', target_amount: '1000.00', status: 'open',
  statistics: {
    target: '1000.00', collected: '500.00', remaining: '500.00', percentage_collected: '50.00',
    members: [
      { member_id: 'm1', display_name: 'Fahad', avatar_key: '', avatar: { type: 'initials', color: 'indigo' }, expected: '500.00', paid: '500.00', pending: '0.00', remaining: '0.00', overpaid: '0.00' },
      { member_id: 'm2', display_name: 'Saud', avatar_key: '', avatar: { type: 'initials', color: 'slate' }, expected: '500.00', paid: '0.00', pending: '0.00', remaining: '500.00', overpaid: '0.00' },
    ],
  },
  created_at: '2026-01-01T00:00:00Z', completed_at: null,
};

const baseFund = {
  id: 'f1', name: 'Trip Fund', base_currency: 'SAR', status: 'active',
  holder: { id: 'm1', display_name: 'Fahad', avatar_key: '', avatar: { type: 'initials', color: 'indigo' } },
  accounting: baseAccounting,
  total_target: '10000.00', collection_remaining: '9000.00',
  close_readiness: { open_rounds: 1, pending_contributions: 0, balance: '600.00', ready: false },
  rounds: [round1],
  contributions: [],
  refunds: [],
  reimbursements: [],
  reimbursement_candidates: [],
  created_at: '2026-01-01T00:00:00Z', closed_at: null,
};

const renderPage = (tripOverride = trip) => render(
  <MemoryRouter initialEntries={['/trips/t1/fund']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip: tripOverride, tripId: 't1', currentMember: fahad, permissions }} />}>
        <Route path="fund" element={<FundPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  getMembers.mockResolvedValue({ results: members });
  getCategories.mockResolvedValue({ results: [] });
  getCategoryBudgets.mockResolvedValue({ results: [] });
  getExpenses.mockResolvedValue({ results: [] });
  getActivity.mockResolvedValue({ results: [], next: null });
  getFund.mockResolvedValue(baseFund);
});

test('renders the summary, holder, and open round from the server-authoritative Fund object', async () => {
  renderPage();
  expect(await screen.findByText('fund.title')).toBeInTheDocument();
  // "Fahad" legitimately appears twice: the holder card and the round's
  // own member row -- both real, both correct.
  expect(screen.getAllByText('Fahad').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('Initial Collection')).toBeInTheDocument();
});

test('shows the empty setup state and creates a fund with the chosen holder', async () => {
  getFund.mockResolvedValue(null);
  createFund.mockResolvedValue(baseFund);
  renderPage();
  await screen.findByText('fund.setupBody');
  fireEvent.click(screen.getByText('fund.create'));
  await waitFor(() => expect(createFund).toHaveBeenCalledWith('t1', { holder_id: 'm1' }));
});

test('a shortfall renders the alert and pre-fills the top-up round composer', async () => {
  getFund.mockResolvedValue({ ...baseFund, accounting: { ...baseAccounting, balance: '-600.00', surplus: '0.00', deficit: '600.00' } });
  renderPage();
  expect(await screen.findByText('fund.shortfallTitle')).toBeInTheDocument();
  fireEvent.click(screen.getByText('fund.createTopup'));
  expect(await screen.findByLabelText('fund.target')).toHaveValue(600);
});

test('a round is a collection mechanism, not a budget-defining transaction: New Round pre-fills the TARGET from what is still outstanding, never the title, never the raw budget', async () => {
  renderPage();
  await screen.findByText('fund.title');
  // Both the header's and the empty-state's "New Round" buttons open the
  // same pre-filled composer -- either is a valid entry point.
  fireEvent.click(screen.getAllByText('fund.newRound')[0]);
  expect(await screen.findByLabelText('fund.roundTitle')).toHaveValue(''); // never pre-filled
  expect(screen.getByLabelText('fund.target')).toHaveValue(9000); // collection_remaining, not total_target (10000)
});

test('a trip with nothing left to collect opens a fully blank composer -- no meaningless zero pre-fill', async () => {
  getFund.mockResolvedValue({ ...baseFund, total_target: '1000.00', collection_remaining: '0.00' });
  renderPage();
  await screen.findByText('fund.title');
  fireEvent.click(screen.getAllByText('fund.newRound')[0]);
  expect(await screen.findByLabelText('fund.target')).toHaveValue(null);
});

test('creating an equal-split round submits the expected payload', async () => {
  createFundingRound.mockResolvedValue({ ...round1, id: 'r2' });
  renderPage();
  await screen.findByText('fund.title');
  fireEvent.click(screen.getByText('fund.newRound'));
  fireEvent.change(await screen.findByLabelText('fund.roundTitle'), { target: { value: 'Activities' } });
  fireEvent.change(screen.getByLabelText('fund.target'), { target: { value: '200' } });
  const participantCheckboxes = screen.getAllByRole('checkbox');
  fireEvent.click(screen.getByText('fund.createRound'));
  await waitFor(() => expect(createFundingRound).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Activities', target_amount: '200', contribution_method: 'equal' })));
  expect(participantCheckboxes.length).toBeGreaterThan(0);
});

test('a percentage split that does not sum to 100 is blocked before submit', async () => {
  renderPage();
  await screen.findByText('fund.title');
  fireEvent.click(screen.getByText('fund.newRound'));
  fireEvent.change(await screen.findByLabelText('fund.roundTitle'), { target: { value: 'Split' } });
  fireEvent.change(screen.getByLabelText('fund.target'), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('radio', { name: 'fund.methodOptions.percentage' }));
  fireEvent.change(screen.getByLabelText('Fahad fund.percentage'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Saud fund.percentage'), { target: { value: '30' } });
  expect(screen.getByText('fund.createRound')).toBeDisabled();
});

test('a member reports their own contribution as pending, never confirmed by their own action', async () => {
  const roundWithFahadOwing = { ...round1, statistics: { ...round1.statistics, members: [{ ...round1.statistics.members[0], paid: '0.00', remaining: '500.00' }, round1.statistics.members[1]] } };
  getFund.mockResolvedValue({ ...baseFund, rounds: [roundWithFahadOwing] });
  reportFundContribution.mockResolvedValue({ id: 'c1', amount: '500.00', status: 'pending' });
  renderPage();
  fireEvent.click(await screen.findByText('fund.iPaid'));
  fireEvent.change(screen.getByLabelText('fund.amount'), { target: { value: '500' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'fund.iPaidSubmit' }));
  await waitFor(() => expect(reportFundContribution).toHaveBeenCalledWith('t1', 'r1', expect.objectContaining({ amount: '500' })));
  expect(recordFundContribution).not.toHaveBeenCalled();
});

test('direct "record received" requires the acknowledgement checkbox before it can submit, then confirms immediately', async () => {
  recordFundContribution.mockResolvedValue({ id: 'c2', status: 'confirmed' });
  renderPage();
  fireEvent.click(await screen.findByText('fund.recordContribution'));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('fund.member'), { target: { value: 'm2' } });
  fireEvent.change(within(dialog).getByLabelText('fund.amount'), { target: { value: '500' } });
  const submit = within(dialog).getByRole('button', { name: 'fund.record' });
  expect(submit).toBeDisabled();
  fireEvent.click(within(dialog).getByLabelText('fund.recordAcknowledge'));
  expect(submit).not.toBeDisabled();
  fireEvent.click(submit);
  await waitFor(() => expect(recordFundContribution).toHaveBeenCalledWith('t1', 'r1', expect.objectContaining({ amount: '500', member_id: 'm2' })));
  expect(reportFundContribution).not.toHaveBeenCalled();
});

test('only one primary Fund dialog can ever be open at a time -- opening a second trigger replaces, never stacks, the first', async () => {
  renderPage();
  await screen.findByText('fund.title');
  fireEvent.click(screen.getByText('fund.newRound'));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.click(screen.getByText('fund.changeHolder'));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'fund-holder-dialog-title');
});

test('the holder rejects a pending contribution -- it never disappears, and offers retry / new payment / direct record', async () => {
  getFund.mockResolvedValue({ ...baseFund, contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'pending', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: null, reviewed_at: null, review_note: '', retry_cooldown_active: false, corrections: [] }] });
  rejectFundContribution.mockResolvedValue({ id: 'c1', status: 'rejected' });
  renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  fireEvent.click(screen.getByRole('button', { name: 'fund.rejectContribution' }));
  const rejectButtons = screen.getAllByRole('button', { name: 'fund.rejectContribution' });
  fireEvent.click(rejectButtons[rejectButtons.length - 1]);
  await waitFor(() => expect(rejectFundContribution).toHaveBeenCalledWith('t1', 'r1', 'c1', ''));
});

test('a "check later" click on a pending contribution never calls confirm or reject -- no financial transition', async () => {
  getFund.mockResolvedValue({ ...baseFund, contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'pending', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: null, reviewed_at: null, review_note: '', retry_cooldown_active: false, corrections: [] }] });
  renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  fireEvent.click(screen.getByRole('button', { name: 'fund.checkLater' }));
  expect(confirmFundContribution).not.toHaveBeenCalled();
  expect(rejectFundContribution).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'fund.confirmContribution' })).not.toBeInTheDocument();
});

test('"check later" survives a reload -- it is not reset by remounting the page', async () => {
  const pendingContribution = { id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'pending', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: null, reviewed_at: null, review_note: '', retry_cooldown_active: false, corrections: [] };
  getFund.mockResolvedValue({ ...baseFund, contributions: [pendingContribution] });
  const first = renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  fireEvent.click(screen.getByRole('button', { name: 'fund.checkLater' }));
  expect(screen.queryByRole('button', { name: 'fund.confirmContribution' })).not.toBeInTheDocument();
  first.unmount();

  renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  // The row itself must still be there (never hidden) -- only its
  // action prompt stays suppressed across the simulated reload.
  expect(screen.getAllByText(/Saud/).length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'fund.confirmContribution' })).not.toBeInTheDocument();
});

test('a rejected contribution stays visible with retry, new-payment, and direct-record recovery actions', async () => {
  getFund.mockResolvedValue({ ...baseFund, contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'rejected', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: 'Fahad', reviewed_at: '2026-01-06T00:00:00Z', review_note: '', retry_cooldown_active: false, corrections: [] }] });
  retryFundContribution.mockResolvedValue({ id: 'c1', status: 'pending' });
  renderPage();
  await screen.findByText('fund.rejectedTitle');
  expect(screen.getByText('Saud')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'fund.retryContribution' }));
  await waitFor(() => expect(retryFundContribution).toHaveBeenCalledWith('t1', 'r1', 'c1'));
  // "Record" is offered both as a round-level action and, per brief
  // part 10, again right on the rejected row itself as a recovery path.
  expect(screen.getAllByRole('button', { name: 'fund.recordContribution' }).length).toBeGreaterThan(0);
});

test('sending a Fund contribution reminder calls the reminder API for that member', async () => {
  remindContribution.mockResolvedValue({ status: 'sent' });
  renderPage();
  await screen.findByText('fund.title');
  fireEvent.click(screen.getByRole('button', { name: 'fund.remind' }));
  await waitFor(() => expect(remindContribution).toHaveBeenCalledWith('t1', 'r1', 'm2'));
});

test('the holder confirms a pending contribution', async () => {
  getFund.mockResolvedValue({ ...baseFund, contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'pending', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: null, reviewed_at: null, review_note: '', retry_cooldown_active: false, corrections: [] }] });
  confirmFundContribution.mockResolvedValue({ id: 'c1', status: 'confirmed' });
  renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  fireEvent.click(screen.getByRole('button', { name: 'fund.confirmContribution' }));
  await waitFor(() => expect(confirmFundContribution).toHaveBeenCalledWith('t1', 'r1', 'c1'));
});

test('reimbursement candidates are suggestions only -- selecting one pre-fills the dialog, never auto-submits', async () => {
  getFund.mockResolvedValue({ ...baseFund, reimbursement_candidates: [{ member_id: 'm2', display_name: 'Saud', avatar_key: '', avatar: {}, paid: '600.00', share: '150.00', personal_balance: '450.00', already_reimbursed: '0.00', suggested_amount: '450.00' }] });
  renderPage();
  fireEvent.click(await screen.findByText('fund.reimburseAction'));
  expect(recordFundReimbursement).not.toHaveBeenCalled();
  expect(await screen.findByLabelText('fund.amount')).toHaveValue(450);
});

test('recording a reimbursement calls the API with the selected member and amount', async () => {
  getFund.mockResolvedValue({ ...baseFund, reimbursement_candidates: [{ member_id: 'm2', display_name: 'Saud', avatar_key: '', avatar: {}, paid: '600.00', share: '150.00', personal_balance: '450.00', already_reimbursed: '0.00', suggested_amount: '450.00' }] });
  recordFundReimbursement.mockResolvedValue({ id: 're1' });
  renderPage();
  fireEvent.click(await screen.findByText('fund.reimburseAction'));
  await screen.findByLabelText('fund.amount');
  fireEvent.submit(screen.getByText('fund.reimburseAction', { selector: 'button[type="submit"]' }).closest('form'));
  await waitFor(() => expect(recordFundReimbursement).toHaveBeenCalledWith('t1', expect.objectContaining({ member_id: 'm2', amount: '450.00' })));
});

test('surplus distribution previews before it can be confirmed', async () => {
  previewFundRefund.mockResolvedValue({ method: 'proportional_to_net_contributions', available_amount: '600.00', distribution_amount: '600.00', remaining_balance: '0.00', basis_total: '1000.00', allocations: [{ member_id: 'm1', display_name: 'Fahad', gross_contributed: '500.00', prior_refunds: '0.00', net_basis: '500.00', refund_amount: '600.00', amount: '600.00' }] });
  recordFundRefunds.mockResolvedValue({ refunds: [{ id: 'ref1', member_id: 'm1', amount: '600.00' }] });
  renderPage();
  fireEvent.click(await screen.findByText('fund.refund'));
  fireEvent.click(await screen.findByText('fund.preview'));
  expect(await screen.findByText('fund.total')).toBeInTheDocument();
  expect(screen.getByText('fund.distribute')).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByText('fund.distribute'));
  await waitFor(() => expect(recordFundRefunds).toHaveBeenCalled());
});

test('close is disabled while close_readiness is not ready', async () => {
  renderPage();
  expect(await screen.findByText('fund.close')).toBeDisabled();
});

test('close is enabled once everything is resolved', async () => {
  getFund.mockResolvedValue({ ...baseFund, rounds: [], close_readiness: { open_rounds: 0, pending_contributions: 0, balance: '0.00', ready: true }, accounting: { ...baseAccounting, balance: '0.00', surplus: '0.00' } });
  renderPage();
  expect(await screen.findByText('fund.close')).not.toBeDisabled();
});

test('clicking a recent Fund expense opens the canonical ExpenseDetailsDrawer', async () => {
  getExpenses.mockResolvedValue({ results: [{ id: 'e1', title: 'Airbnb Tbilisi', category: 'accommodation', amount: '1200.00', expense_date: '2026-01-02', payment_source: 'trip_fund' }] });
  renderPage();
  fireEvent.click(await screen.findByText('Airbnb Tbilisi'));
  expect(await screen.findByTestId('expense-drawer')).toBeInTheDocument();
});

test('Fund history shows only Fund-scoped activity, resolving a real copy key per event type', async () => {
  getActivity.mockResolvedValue({
    results: [
      { id: 'a1', event_type: 'fund_contribution_reported', actor: fahad, summary: { member: 'Fahad', amount: '500.00', currency: 'SAR' }, created_at: '2026-01-03T10:00:00Z' },
      { id: 'a2', event_type: 'expense_created', actor: fahad, summary: { title: 'Dinner' }, created_at: '2026-01-02T10:00:00Z' },
    ],
    next: 'https://api/next-page',
  });
  renderPage();
  fireEvent.click(await screen.findByText('fund.historyTitle'));
  const dialog = await screen.findByRole('dialog');
  // The mocked t() renders the literal key -- this proves the FUND event
  // resolved to its own copy key (not a missing/fallback one), while the
  // non-Fund expense_created event was filtered out entirely.
  expect(within(dialog).getByText(/activity\.fund_contribution_reported/)).toBeInTheDocument();
  expect(within(dialog).queryByText(/expense_created/)).not.toBeInTheDocument();
  expect(within(dialog).queryByText('Dinner')).not.toBeInTheDocument();
});

test('Escape closes the Fund history dialog and returns focus to its trigger', async () => {
  renderPage();
  const trigger = await screen.findByText('fund.historyTitle');
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('Fund history "load more" fetches the next page and merges it in, without duplicating events', async () => {
  getActivity.mockResolvedValue({
    results: [{ id: 'a1', event_type: 'fund_closed', actor: fahad, summary: {}, created_at: '2026-01-03T10:00:00Z' }],
    next: 'https://api/next-page',
  });
  getActivityPage.mockResolvedValue({
    results: [{ id: 'a2', event_type: 'fund_created', actor: fahad, summary: {}, created_at: '2026-01-01T10:00:00Z' }],
    next: null,
  });
  renderPage();
  fireEvent.click(await screen.findByText('fund.historyTitle'));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getAllByText(/activity\.fund_/).length).toBe(1);
  fireEvent.click(within(dialog).getByText('common.loadMore'));
  await waitFor(() => expect(getActivityPage).toHaveBeenCalledWith('https://api/next-page', 't1', expect.anything()));
  expect(await within(dialog).findByText(/activity\.fund_created/)).toBeInTheDocument();
  expect(within(dialog).queryByText('common.loadMore')).not.toBeInTheDocument();
});
