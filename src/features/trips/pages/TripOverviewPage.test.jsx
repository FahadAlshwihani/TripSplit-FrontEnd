import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripOverviewPage from './TripOverviewPage';
import { getTripOverview } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));
jest.mock('../api/tripsApi', () => ({ getTripOverview: jest.fn() }));

const baseOverview = {
  trip: { title: 'Georgia Winter Trip', currency: 'SAR' },
  summary: { budget: '12000.00', budget_set: true, total_spent: '7720.00', remaining: '4280.00', my_balance: '620.00', total_allocated: null, unallocated: null },
  spending_split: { shared: '5000.00', personal: '2720.00', shared_percent: 65, personal_percent: 35 },
  category_ledger: [
    { code: 'food', name: 'Food & Dining', icon_key: 'utensils', spent: '3100.00', percent_of_total: 40 },
  ],
  // No Fund set up on this trip -- the same shape apps.funds.services.
  // get_fund_summary returns for has_fund: False.
  fund: { has_fund: false, total_target: '12000.00', collected: '0.00', collection_remaining: '12000.00', collection_percent: 0, available: '0.00', spent_from_fund: '0.00', reimbursed: '0.00', refunded: '0.00', shortfall: '0.00' },
  funding_rounds_summary: [],
  recent_activity: [
    { id: 'a1', event_type: 'expense_created', actor: { display_name: 'Sarah', avatar: { type: 'initials', key: 'i1' } }, target: { type: 'expense', id: 'e1' }, summary: { title: 'Ski Pass Rental', amount: '1200.00', currency: 'SAR', scope: 'shared' }, created_at: '2026-12-14T10:00:00Z' },
  ],
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ tripId: 't1' }} />}>
        <Route path="overview" element={<TripOverviewPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

// Money renders as <bdi dir="ltr">1,200.00<span> SAR</span></bdi> -- a
// plain getByText(exact string) can't match text split across a child
// span, so match on the <bdi>'s combined, whitespace-normalized text.
const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);
const findMoney = (text) => screen.findByText(moneyMatcher(text));
const getMoney = (text) => screen.getByText(moneyMatcher(text));
const queryMoney = (text) => screen.queryByText(moneyMatcher(text));

beforeEach(() => jest.clearAllMocks());

test('renders the four summary figures from the authoritative overview payload', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await findMoney('12,000.00 SAR')).toBeInTheDocument();
  expect(getMoney('7,720.00 SAR')).toBeInTheDocument();
  expect(getMoney('4,280.00 SAR')).toBeInTheDocument();
  expect(getMoney('620.00 SAR')).toBeInTheDocument();
});

test('a Fund-enabled trip renders the Fund snapshot panel with the same total_target as the budget card', async () => {
  getTripOverview.mockResolvedValue({
    ...baseOverview,
    fund: { has_fund: true, total_target: '12000.00', collected: '9500.00', collection_remaining: '2500.00', collection_percent: 79, available: '3200.00', spent_from_fund: '5800.00', reimbursed: '500.00', refunded: '0.00', shortfall: '0.00' },
    funding_rounds_summary: [{ id: 'r1', title: 'Initial Trip Budget', target_amount: '12000.00', status: 'open' }],
  });
  renderPage();
  expect(await screen.findByText('dashboard.overview.fundTitle')).toBeInTheDocument();
  expect(getMoney('9,500.00 SAR')).toBeInTheDocument(); // collected
  expect(getMoney('3,200.00 SAR')).toBeInTheDocument(); // available
});

test('a trip with no Fund set up shows no Fund snapshot panel at all -- Overview looks exactly as before', async () => {
  getTripOverview.mockResolvedValue(baseOverview); // fund.has_fund: false
  renderPage();
  await findMoney('12,000.00 SAR');
  expect(screen.queryByText('dashboard.overview.fundTitle')).not.toBeInTheDocument();
});

test('a positive balance is marked positive, distinct from a negative one', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await findMoney('620.00 SAR');
  expect(document.querySelector('.ov-card--balance')).toHaveClass('is-positive');
});

test('a negative balance is marked negative', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, summary: { ...baseOverview.summary, my_balance: '-142.50' } });
  renderPage();
  await findMoney('-142.50 SAR');
  expect(document.querySelector('.ov-card--balance')).toHaveClass('is-negative');
});

test('a trip with no budget set shows "no budget" instead of a computed remaining figure', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, summary: { ...baseOverview.summary, budget_set: false, remaining: null } });
  renderPage();
  await screen.findByText('Georgia Winter Trip', { exact: false });
  expect(screen.getAllByText('dashboard.overview.noBudgetSet').length).toBe(2);
});

test('an empty category ledger shows the empty-state message, not a broken chart', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, category_ledger: [] });
  renderPage();
  expect(await screen.findByText('dashboard.overview.noCategorizedExpenses')).toBeInTheDocument();
});

test('an empty activity feed shows the empty-state message', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, recent_activity: [] });
  renderPage();
  expect(await screen.findByText('dashboard.overview.noActivity')).toBeInTheDocument();
});

test('a load failure shows a retry action instead of a raw error', async () => {
  getTripOverview.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('dashboard.overview.errorLoad')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

test('renders the recent activity row with actor, title, and amount', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await screen.findByText('Ski Pass Rental')).toBeInTheDocument();
  expect(screen.getByText(/"name":"Sarah"/)).toBeInTheDocument();
  expect(getMoney('1,200.00 SAR')).toBeInTheDocument();
});

test('uses the trip currency from the overview payload itself, not a guessed default', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, trip: { ...baseOverview.trip, currency: 'USD' } });
  renderPage();
  expect(await findMoney('12,000.00 USD')).toBeInTheDocument();
});

test('the refresh control re-fetches the overview; the disabled filter control never fakes a working filter', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await findMoney('12,000.00 SAR');
  const filterBtn = screen.getByRole('button', { name: 'dashboard.overview.filter' });
  expect(filterBtn).toBeDisabled();
  const refreshBtn = screen.getByRole('button', { name: 'dashboard.overview.refresh' });
  expect(refreshBtn).not.toBeDisabled();
  await act(async () => { fireEvent.click(refreshBtn); });
  expect(getTripOverview).toHaveBeenCalledTimes(2);
});

test('a trip with no spending yet shows the neutral Spending Split empty state, never a misleading 100% badge', async () => {
  // Budget/Remaining both land on "6,000.00 SAR", and Total Spent/My
  // Balance both land on "0.00 SAR" -- a real, legitimate collision for
  // an untouched trip (this is exactly the screenshot scenario), so
  // assert counts rather than a single ambiguous getByText match.
  getTripOverview.mockResolvedValue({
    ...baseOverview,
    summary: { budget: '6000.00', budget_set: true, total_spent: '0.00', remaining: '6000.00', my_balance: '0.00' },
    spending_split: { shared: '0.00', personal: '0.00', shared_percent: 0, personal_percent: 0 },
    category_ledger: [],
    recent_activity: [],
  });
  renderPage();
  expect(await screen.findByText('dashboard.overview.noSpendingYet')).toBeInTheDocument();
  expect(screen.queryByText('100%')).not.toBeInTheDocument();
  expect(screen.getAllByText(moneyMatcher('6,000.00 SAR'))).toHaveLength(2);
  expect(screen.getAllByText(moneyMatcher('0.00 SAR'))).toHaveLength(2);
});

test('every money amount is isolated for correct bidi rendering regardless of page direction', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  const node = await findMoney('12,000.00 SAR');
  expect(node).toHaveAttribute('dir', 'ltr');
  expect(queryMoney('7,720.00 SAR')).toHaveAttribute('dir', 'ltr');
});
