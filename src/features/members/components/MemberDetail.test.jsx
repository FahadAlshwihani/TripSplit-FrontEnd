import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import MemberDetail from './MemberDetail';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts?.name ? `${key}:${opts.name}` : key), i18n: { language: 'en' } }) }));

const baseMember = { id: 'm1', display_name: 'Sara', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, active: true, joined_at: '2026-01-01T00:00:00Z' };
const baseStatistics = { total_paid: '10.00', total_expense_share: '5.00', total_personal_spending: '0.00', settlements_sent: '0.00', settlements_received: '0.00', current_balance: '5.00', expense_count: 2, last_activity_at: '2026-01-02T00:00:00Z', fund: { contributed: '0', reimbursed: '0' } };

const renderDetail = (detail, extra = {}) => render(
  <MemoryRouter>
    <MemberDetail detail={detail} currency="SAR" tripId="trip-1" {...extra} />
  </MemoryRouter>,
);

test('shows a neutral empty state when no member is selected', () => {
  renderDetail(null);
  expect(screen.getByText('members.selectAMember')).toBeInTheDocument();
});

test('renders the canonical Money component for the current balance, not a raw string', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  const balanceRow = screen.getByText('members.currentBalance').closest('.member-detail-panel__balance');
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

test('renders Fund participation as a separate block only when there is any, never mixed into the balance', () => {
  const withFund = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: { ...baseStatistics, fund: { contributed: '100', reimbursed: '40.00' } } };
  renderDetail(withFund);
  expect(screen.getByText('members.fundParticipation')).toBeInTheDocument();
  expect(screen.getByText('members.fundContributed')).toBeInTheDocument();
  expect(screen.getByText('members.fundReimbursed')).toBeInTheDocument();
});

test('omits the Fund participation block entirely when the member has none', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  expect(screen.queryByText('members.fundParticipation')).not.toBeInTheDocument();
});

test('renders email only when the server includes it, isolated dir="ltr"', () => {
  const withEmail = { member: { ...baseMember, email: 'sara@example.com', capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(withEmail);
  const emailNode = screen.getByText('sara@example.com');
  expect(emailNode.closest('bdi')).toHaveAttribute('dir', 'ltr');
});

test('never renders a fake placeholder email when the server omits it', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  expect(screen.queryByText(/@/)).not.toBeInTheDocument();
});

test('onBack, when provided, calls back on click', () => {
  const onBack = jest.fn();
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail, { onBack });
  fireEvent.click(screen.getByText('common.back'));
  expect(onBack).toHaveBeenCalled();
});
