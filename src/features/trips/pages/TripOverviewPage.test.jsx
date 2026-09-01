import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripOverviewPage from './TripOverviewPage';
import { getTripOverview } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));
jest.mock('../api/tripsApi', () => ({ getTripOverview: jest.fn() }));

// The Trip Fund IS the trip budget (see docs/architecture/
// fund-accounting.md) -- the summary bento's Budget and Available cards
// both read canonical Fund figures off this same `fund`/`summary` block
// rather than a separate Trip-level field; the compact FundSnapshot
// panel below only adds collection progress, never repeating either.
// The overview payload no longer carries its own `trip` sub-object for
// title/currency purposes -- the page reads those from the outlet
// context (TripLayout's own already-loaded fetch) instead, so the
// header can render before this endpoint ever resolves. `trip` is kept
// here only because other overview fields still reference it loosely
// in a couple of older fixtures below; it's otherwise unused by the
// page itself now.
const baseOverview = {
  trip: { title: 'Georgia Winter Trip', currency: 'SAR' },
  summary: { budget: '12000.00', budget_set: true, total_spent: '7720.00', remaining: '4280.00', my_balance: '620.00', total_allocated: null, unallocated: null },
  spending_split: { shared: '5000.00', personal: '2720.00', shared_percent: 65, personal_percent: 35 },
  category_ledger: [
    { code: 'food', name: 'Food & Dining', icon_key: 'utensils', spent: '3100.00', percent_of_total: 40 },
  ],
  fund: { has_fund: true, total_target: '12000.00', collected: '9500.00', collection_remaining: '2500.00', collection_percent: 79, available: '3200.00', spent_from_fund: '5800.00', reimbursed: '500.00', refunded: '0.00', shortfall: '0.00' },
  funding_rounds_summary: [{ id: 'r1', title: 'Initial round', target_amount: '12000.00', status: 'open' }],
  recent_activity: [
    { id: 'a1', event_type: 'expense_created', actor: { display_name: 'Sarah', avatar: { type: 'initials', key: 'i1' } }, target: { type: 'expense', id: 'e1' }, summary: { title: 'Ski Pass Rental', amount: '1200.00', currency: 'SAR', scope: 'shared' }, created_at: '2026-12-14T10:00:00Z' },
  ],
};

const contextTrip = { short_code: 't1', title: 'Georgia Winter Trip', currency: 'SAR' };

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ tripId: 't1', trip: contextTrip, ...ctxOverrides }} />}>
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

test('renders total spent and my balance from the authoritative overview payload', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await findMoney('7,720.00 SAR')).toBeInTheDocument();
  expect(getMoney('620.00 SAR')).toBeInTheDocument();
});

test('the summary bento renders all four canonical metrics: budget, spent, available, and my balance', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await findMoney('7,720.00 SAR')).toBeInTheDocument(); // total spent
  // 12,000.00 is the budget card's own value; it also reappears in the
  // Fund snapshot's collected/target progress ratio below, so this
  // asserts presence, not a single match.
  expect(screen.getAllByText(moneyMatcher('12,000.00 SAR')).length).toBeGreaterThanOrEqual(1);
  expect(document.querySelector('.ov-card--budget')).toHaveTextContent('12,000.00');
  expect(getMoney('3,200.00 SAR')).toBeInTheDocument(); // available (fund.available, the canonical accounting() balance)
  expect(getMoney('620.00 SAR')).toBeInTheDocument(); // my balance
});

test('never shows a "Budget Remaining" card -- replaced by Available in Fund', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await findMoney('7,720.00 SAR');
  expect(screen.queryByText('dashboard.overview.remaining')).not.toBeInTheDocument();
  expect(document.querySelector('.ov-card--remaining')).not.toBeInTheDocument();
  expect(document.querySelector('.ov-card--available')).toBeInTheDocument();
});

test('a Fund-enabled trip renders the compact Fund snapshot panel with collection progress, never repeating the budget/available figures already in the summary bento', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await screen.findByText('fund.budgetTarget')).toBeInTheDocument();
  expect(screen.getByText(moneyMatcher('9,500.00 SAR'))).toBeInTheDocument(); // collected
  // 3,200.00 (available) appears exactly once on the page -- in the summary card, not duplicated in the Fund snapshot below.
  expect(screen.getAllByText(moneyMatcher('3,200.00 SAR')).length).toBe(1);
});

test('a trip with no Fund/target set yet shows the zero-state budget prompt, never a blank space', async () => {
  getTripOverview.mockResolvedValue({
    ...baseOverview,
    fund: { has_fund: false, total_target: '0.00', collected: '0.00', collection_remaining: '0.00', collection_percent: 0, available: '0.00', spent_from_fund: '0.00', reimbursed: '0.00', refunded: '0.00', shortfall: '0.00' },
    funding_rounds_summary: [],
  });
  renderPage();
  expect(await screen.findByText('fund.budgetNotSetYet')).toBeInTheDocument();
  expect(screen.getByText('fund.editBudget')).toHaveAttribute('href', '/trips/t1/fund');
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

test('uses the trip currency from the outlet context (TripLayout\'s own already-loaded trip), not the overview payload -- currency is available before this page\'s own fetch ever resolves', async () => {
  getTripOverview.mockResolvedValue(baseOverview); // payload's own nested trip.currency stays 'SAR' throughout
  renderPage({ trip: { ...contextTrip, currency: 'USD' } });
  expect(await findMoney('7,720.00 USD')).toBeInTheDocument();
});

test('the refresh control re-fetches the overview; the disabled filter control never fakes a working filter', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await findMoney('7,720.00 SAR');
  const filterBtn = screen.getByRole('button', { name: 'dashboard.overview.filter' });
  expect(filterBtn).toBeDisabled();
  const refreshBtn = screen.getByRole('button', { name: 'dashboard.overview.refresh' });
  expect(refreshBtn).not.toBeDisabled();
  await act(async () => { fireEvent.click(refreshBtn); });
  expect(getTripOverview).toHaveBeenCalledTimes(2);
});

test('a trip with no spending yet shows the neutral Spending Split empty state, never a misleading 100% badge', async () => {
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
  expect(screen.getAllByText(moneyMatcher('0.00 SAR')).length).toBeGreaterThanOrEqual(2); // total_spent + my_balance
});

test('every money amount is isolated for correct bidi rendering regardless of page direction', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  const node = await findMoney('7,720.00 SAR');
  expect(node).toHaveAttribute('dir', 'ltr');
  expect(queryMoney('620.00 SAR')).toHaveAttribute('dir', 'ltr');
});

// --- Part B: progressive/section-level loading -----------------------

test('the page title and subtitle render immediately, before the overview fetch ever resolves -- no full-page blocking loader', () => {
  getTripOverview.mockImplementation(() => new Promise(() => {})); // never resolves
  renderPage();
  expect(screen.getByText('dashboard.overview.title')).toBeInTheDocument();
  expect(screen.getByText(/dashboard\.overview\.subtitle/)).toBeInTheDocument();
});

test('while the data body is pending, a section-scoped loading indicator shows in its place -- never the app-wide NeoLoading label', () => {
  getTripOverview.mockImplementation(() => new Promise(() => {}));
  renderPage();
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.queryByText('Ski Pass Rental')).not.toBeInTheDocument();
});

test('a background refresh (retry) never blanks the already-rendered page -- stale data stays visible throughout', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await findMoney('7,720.00 SAR');
  let resolveSecond;
  getTripOverview.mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
  const refreshBtn = screen.getByRole('button', { name: 'dashboard.overview.refresh' });
  fireEvent.click(refreshBtn);
  // The second fetch is now in flight -- the first response's data must
  // still be fully rendered, not replaced by a loading placeholder.
  expect(getMoney('7,720.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('dashboard.overview.title')).toBeInTheDocument();
  await act(async () => { resolveSecond(baseOverview); });
});

test('a load failure (no prior data) shows the error inside the page body -- the header stays visible', async () => {
  getTripOverview.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('dashboard.overview.errorLoad')).toBeInTheDocument();
  expect(screen.getByText('dashboard.overview.title')).toBeInTheDocument();
});
