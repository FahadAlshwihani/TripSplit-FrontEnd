import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripIntelligence from './TripIntelligence';
import { getTripIntelligence } from '../../api/tripsApi';

jest.mock('../../api/tripsApi', () => ({ getTripIntelligence: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderInsights = (placement = 'overview', direction = 'rtl') => render(
  <MemoryRouter><div dir={direction}><TripIntelligence tripId="uuid" tripRef="short" placement={placement} /></div></MemoryRouter>,
);

beforeEach(() => getTripIntelligence.mockReset());

test('renders contextual payer suggestion with explanation and canonical trip action', async () => {
  getTripIntelligence.mockResolvedValue({
    currency: 'SAR', health: { status: 'WATCH' }, suggestions: [
      { code: 'next_payer', priority: 6, action: 'balances', payer: { name: 'Abdullah', balance_before: '-420.00' } },
    ],
  });
  renderInsights('balances');
  expect(await screen.findByText(/Abdullah/)).toBeInTheDocument();
  expect(screen.getByText('✨')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'intelligence.action.balances' })).toHaveAttribute('href', '/trips/short/balances');
  fireEvent.click(screen.getByRole('button', { name: 'intelligence.why' }));
  expect(screen.getByText('-420.00 SAR')).toHaveAttribute('dir', 'ltr');
});

test('suppresses irrelevant and empty-trip suggestions', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'NO_DATA' }, suggestions: [] });
  const { container } = renderInsights();
  await waitFor(() => expect(getTripIntelligence).toHaveBeenCalledTimes(1));
  expect(container.querySelector('.trip-intelligence')).toBeNull();
});

test('overview caps ranked cards at three without introducing an AI tab', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'WATCH' }, suggestions: [
    { code: 'financial_risk', priority: 1, action: 'expenses' },
    { code: 'fund_shortfall', priority: 2, action: 'fund' },
    { code: 'next_payer', priority: 6, action: 'balances', payer: { name: 'A', balance_before: '-20.00' } },
    { code: 'forecast', priority: 8, action: 'expenses', projected_total: '500.00' },
  ] });
  const { container } = renderInsights();
  expect(await screen.findByText('intelligence.heading')).toBeInTheDocument();
  expect(container.querySelectorAll('.trip-insight')).toHaveLength(3);
  expect(container.querySelectorAll('.trip-insight--primary')).toHaveLength(1);
  expect(container.querySelectorAll('.trip-insight--secondary')).toHaveLength(2);
  expect(screen.queryByText('intelligence.forecast.title')).not.toBeInTheDocument();
});

test('settlements keeps closeout blockers collapsed until requested', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'WATCH' }, suggestions: [],
    closeout: { ready: false, blockers: [{ code: 'fund_balance', amount: '125.00' }], warnings: [] } });
  renderInsights('settlements');
  expect(await screen.findByText('intelligence.closeoutTitle')).toBeInTheDocument();
  expect(screen.queryByText('125.00 SAR')).not.toBeInTheDocument();
  const details = screen.getByRole('button', { name: 'intelligence.showDetails' });
  expect(details).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(details);
  expect(details).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('125.00 SAR')).toHaveAttribute('dir', 'ltr');
});

test('closeout checklist can be clear even without a planning target', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', spending: { expense_count: 1 },
    health: { status: 'NO_DATA' }, suggestions: [], closeout: { ready: true, blockers: [], warnings: [] } });
  renderInsights('settlements');
  expect(await screen.findByText('intelligence.closeoutReady')).toBeInTheDocument();
});

test('closed trip recap is aggregate-only and bilingual copy stays in HTML', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'HEALTHY' }, suggestions: [],
    recap: { trip_title: 'رحلة الصيف', expense_count: 3, member_count: 2, duration_days: 5,
      total_spent: '150.00', average_per_member: '75.00' } });
  renderInsights();
  expect(await screen.findByText('intelligence.recap')).toBeInTheDocument();
  expect(screen.getByText('رحلة الصيف')).toBeInTheDocument();
  expect(screen.getByText('150.00 SAR')).toHaveAttribute('dir', 'ltr');
});

test('category risk uses the canonical localized category label', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'WATCH' }, suggestions: [
    { code: 'category_risk', priority: 3, action: 'expenses', category: { code: 'food', name: 'Food' } },
  ] });
  renderInsights('expenses');
  expect(await screen.findByText(/categories\.food/)).toBeInTheDocument();
});

test('healthy overview is a single compact strip without empty cards', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'HEALTHY' }, suggestions: [] });
  const { container } = renderInsights();
  expect(await screen.findByText(/intelligence.health.HEALTHY/)).toBeInTheDocument();
  expect(container.querySelectorAll('.trip-insight')).toHaveLength(0);
  expect(container.querySelector('.trip-intelligence__list')).toBeNull();
});

test('settlements has one primary recommendation while its checklist stays compact', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', spending: { expense_count: 2 },
    suggestions: [
      { code: 'closeout_blockers', priority: 4, action: 'fund' },
      { code: 'settle_now', priority: 5, action: 'settlements', outstanding: '300.00' },
    ], closeout: { ready: false, blockers: [{ code: 'fund_balance', amount: '120.00' }], warnings: [] } });
  const { container } = renderInsights('settlements', 'ltr');
  expect(await screen.findByText('intelligence.closeout_blockers.title')).toBeInTheDocument();
  expect(screen.queryByText('intelligence.settle_now.title')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.trip-insight--primary')).toHaveLength(1);
  expect(container.querySelector('.trip-intelligence')).toHaveAttribute('aria-label', 'intelligence.heading');
  expect(container.querySelector('[dir="ltr"]')).toBeInTheDocument();
});

test('fund context shows compact ranked strips with LTR amounts under RTL', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', suggestions: [
    { code: 'fund_round_gap', priority: 6, action: 'fund', amount: '750.00' },
    { code: 'fund_runway', priority: 8, action: 'fund', runway_days: 4 },
  ] });
  const { container } = renderInsights('fund');
  expect(await screen.findByText('750.00 SAR')).toHaveAttribute('dir', 'ltr');
  expect(container.querySelectorAll('.trip-insight--secondary')).toHaveLength(2);
  expect(container.querySelectorAll('.trip-insight--primary')).toHaveLength(0);
  expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
});
