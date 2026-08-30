import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import MemberDetail from './MemberDetail';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts?.name ? `${key}:${opts.name}` : key), i18n: { language: 'en' } }) }));

const baseMember = { id: 'm1', display_name: 'Sara', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, active: true, joined_at: '2026-01-01T00:00:00Z' };
const baseStatistics = { total_paid: '10.00', total_expense_share: '5.00', total_personal_spending: '0.00', settlements_sent: '0.00', settlements_received: '0.00', current_balance: '5.00', expense_count: 2, last_activity_at: '2026-01-02T00:00:00Z' };

const renderDetail = (detail) => render(
  <MemoryRouter>
    <MemberDetail detail={detail} currency="SAR" tripId="trip-1" onClose={jest.fn()} />
  </MemoryRouter>,
);

test('renders nothing when there is no detail', () => {
  const { container } = renderDetail(null);
  expect(container).toBeEmptyDOMElement();
});

test('renders the canonical Money component for the current balance, not a raw string', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  const balanceRow = screen.getByText('members.currentBalance').closest('.member-detail__balance');
  expect(balanceRow.querySelector('bdi[dir="ltr"]')).toBeInTheDocument();
  expect(balanceRow.querySelector('.money__currency')).toHaveTextContent('SAR');
});

test('shows Settle Up only when the server reports a real pairwise obligation, not from balance alone', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: true } }, statistics: baseStatistics };
  renderDetail(detail);
  expect(screen.getByText('members.settleUp:Sara')).toBeInTheDocument();
  expect(screen.queryByText('members.viewBalances')).not.toBeInTheDocument();
});

test('falls back to a neutral "view balances" link when balance is non-zero but no pairwise obligation exists', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  expect(screen.queryByText(/members.settleUp/)).not.toBeInTheDocument();
  expect(screen.getByText('members.viewBalances')).toBeInTheDocument();
});

test('shows neither settle nor view-balances link when the balance is exactly zero', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: { ...baseStatistics, current_balance: '0.00' } };
  renderDetail(detail);
  expect(screen.queryByText(/members.settleUp/)).not.toBeInTheDocument();
  expect(screen.queryByText('members.viewBalances')).not.toBeInTheDocument();
});
