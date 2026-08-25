import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripOverviewPage from './TripOverviewPage';
import { getTripOverview } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));
jest.mock('../api/tripsApi', () => ({ getTripOverview: jest.fn() }));

const baseOverview = {
  trip: { title: 'Georgia Winter Trip', currency: 'SAR' },
  summary: { budget: '12000.00', budget_set: true, total_spent: '7720.00', remaining: '4280.00', my_balance: '620.00' },
  spending_split: { shared: '5000.00', personal: '2720.00', shared_percent: 65, personal_percent: 35 },
  category_ledger: [
    { code: 'food', name: 'Food & Dining', icon_key: 'utensils', spent: '3100.00', percent_of_total: 40 },
  ],
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

beforeEach(() => jest.clearAllMocks());

test('renders the four summary figures from the authoritative overview payload', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  expect(await screen.findByText('12,000.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('7,720.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('4,280.00 SAR')).toBeInTheDocument();
  expect(screen.getByText('620.00 SAR')).toBeInTheDocument();
});

test('a positive balance is marked positive, distinct from a negative one', async () => {
  getTripOverview.mockResolvedValue(baseOverview);
  renderPage();
  await screen.findByText('620.00 SAR');
  expect(document.querySelector('.ov-card--balance')).toHaveClass('is-positive');
});

test('a negative balance is marked negative', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, summary: { ...baseOverview.summary, my_balance: '-142.50' } });
  renderPage();
  await screen.findByText('-142.50 SAR');
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
  expect(screen.getByText('1,200.00 SAR')).toBeInTheDocument();
});

test('uses the trip currency from the overview payload itself, not a guessed default', async () => {
  getTripOverview.mockResolvedValue({ ...baseOverview, trip: { ...baseOverview.trip, currency: 'USD' } });
  renderPage();
  expect(await screen.findByText('12,000.00 USD')).toBeInTheDocument();
});
