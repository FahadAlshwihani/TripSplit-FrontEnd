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
  close_readiness: { open_rounds: 1, pending_contributions: 0, balance: '600.00', ready: false },
  rounds: [round1],
  contributions: [],
  refunds: [],
  reimbursements: [],
  reimbursement_candidates: [],
  created_at: '2026-01-01T00:00:00Z', closed_at: null,
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/t1/fund']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions }} />}>
        <Route path="fund" element={<FundPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getMembers.mockResolvedValue({ results: members });
  getCategories.mockResolvedValue({ results: [] });
  getCategoryBudgets.mockResolvedValue({ results: [] });
  getExpenses.mockResolvedValue({ results: [] });
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
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'fund.iPaid' }));
  await waitFor(() => expect(reportFundContribution).toHaveBeenCalledWith('t1', 'r1', expect.objectContaining({ amount: '500' })));
  expect(recordFundContribution).not.toHaveBeenCalled();
});

test('the holder confirms a pending contribution', async () => {
  getFund.mockResolvedValue({ ...baseFund, contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial Collection', member_id: 'm2', display_name: 'Saud', amount: '200.00', contribution_date: '2026-01-05', note: '', voided: false, status: 'pending', origin: 'member_reported', recorded_by: 'Saud', reviewed_by: null, reviewed_at: null, review_note: '', retry_cooldown_active: false, corrections: [] }] });
  confirmFundContribution.mockResolvedValue({ id: 'c1', status: 'confirmed' });
  renderPage();
  await screen.findByText('fund.pendingReviewTitle');
  fireEvent.click(screen.getByLabelText('fund.confirmContribution'));
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
