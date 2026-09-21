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
