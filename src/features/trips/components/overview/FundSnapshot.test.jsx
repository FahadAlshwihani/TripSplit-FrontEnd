import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import FundSnapshot from './FundSnapshot';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const baseFund = {
  has_fund: true, total_target: '12000.00', collected: '9500.00', collection_remaining: '2500.00', collection_percent: 79,
  available: '3200.00', spent_from_fund: '5800.00', reimbursed: '500.00', refunded: '0.00', shortfall: '0.00',
};

const rounds = [
  { id: 'r1', title: 'Initial Trip Budget', target_amount: '10000.00', status: 'completed' },
  { id: 'r2', title: 'Activity top-up', target_amount: '2000.00', status: 'open' },
];

const renderSnapshot = (props = {}) => render(
  <MemoryRouter>
    <FundSnapshot fund={baseFund} roundsSummary={rounds} currency="SAR" tripId="t1" {...props} />
  </MemoryRouter>,
);

const moneyMatcher = (text) => (_content, node) => node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text;

test('renders nothing when the trip has no Fund set up -- Overview stays exactly as before', () => {
  const { container } = render(<MemoryRouter><FundSnapshot fund={{ has_fund: false }} roundsSummary={[]} currency="SAR" tripId="t1" /></MemoryRouter>);
  expect(container).toBeEmptyDOMElement();
});

test('renders nothing when fund is entirely undefined, never crashes', () => {
  const { container } = render(<MemoryRouter><FundSnapshot roundsSummary={[]} currency="SAR" tripId="t1" /></MemoryRouter>);
  expect(container).toBeEmptyDOMElement();
});

test('shows collection progress as collected / target, never available cash mislabeled as collected', () => {
  renderSnapshot();
  expect(screen.getByText(moneyMatcher('9,500.00 SAR'))).toBeInTheDocument();
  expect(screen.getByText(moneyMatcher('12,000.00 SAR'))).toBeInTheDocument();
  expect(screen.getByText(/79%/)).toBeInTheDocument();
});

test('shows available Fund cash as its own distinct metric', () => {
  renderSnapshot();
  expect(screen.getByText(moneyMatcher('3,200.00 SAR'))).toBeInTheDocument();
});

test('no shortfall banner when the Fund balance is non-negative', () => {
  renderSnapshot();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('a negative available balance renders the shortfall alert with a cover-shortfall link into the Fund page', () => {
  renderSnapshot({ fund: { ...baseFund, available: '-700.00', shortfall: '700.00' } });
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('dashboard.overview.fundShortfall');
  expect(screen.getByText('dashboard.overview.coverShortfall')).toHaveAttribute('href', '/trips/t1/fund');
});

test('lists non-cancelled funding rounds as historical collection activity -- never implies they define the target', () => {
  renderSnapshot();
  expect(screen.getByText('Initial Trip Budget')).toBeInTheDocument();
  expect(screen.getByText('Activity top-up')).toBeInTheDocument();
});

test('shows an explicit "remaining to collect" figure, distinct from both available cash and budget remaining', () => {
  renderSnapshot();
  expect(screen.getByText('dashboard.overview.remainingToCollect')).toBeInTheDocument();
  expect(screen.getByText(moneyMatcher('2,500.00 SAR'))).toBeInTheDocument();
});

test('omits the "remaining to collect" line once everything has been collected', () => {
  renderSnapshot({ fund: { ...baseFund, collection_remaining: '0.00', collection_percent: 100 } });
  expect(screen.queryByText('dashboard.overview.remainingToCollect')).not.toBeInTheDocument();
});

test('the Fund link always points at the real Fund page', () => {
  renderSnapshot();
  expect(screen.getByText('dashboard.overview.viewDetails')).toHaveAttribute('href', '/trips/t1/fund');
});
