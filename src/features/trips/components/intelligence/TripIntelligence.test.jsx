import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripIntelligence from './TripIntelligence';
import { getTripIntelligence } from '../../api/tripsApi';

jest.mock('../../api/tripsApi', () => ({ getTripIntelligence: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderInsights = (placement = 'overview') => render(
  <MemoryRouter><TripIntelligence tripId="uuid" tripRef="short" placement={placement} /></MemoryRouter>,
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
  expect(screen.queryByText('intelligence.forecast.title')).not.toBeInTheDocument();
});

test('settlements shows closeout blockers without hiding the page', async () => {
  getTripIntelligence.mockResolvedValue({ currency: 'SAR', health: { status: 'WATCH' }, suggestions: [],
    closeout: { ready: false, blockers: [{ code: 'fund_balance', amount: '125.00' }], warnings: [] } });
  renderInsights('settlements');
  expect(await screen.findByText('intelligence.closeoutTitle')).toBeInTheDocument();
  expect(screen.getByText('125.00 SAR')).toHaveAttribute('dir', 'ltr');
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
