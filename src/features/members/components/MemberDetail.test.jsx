import fs from 'fs';
import path from 'path';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import MemberDetail from './MemberDetail';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts?.name ? `${key}:${opts.name}` : key), i18n: { language: 'en' } }) }));
// MemberDetail builds its own navigation links from trip.short_code
// (via useOutletContext) rather than a tripId prop -- see TripLayout's
// own comment on why.
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useOutletContext: () => ({ trip: { short_code: 'trip-1' } }) }));

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
  const balanceRow = screen.getByText('members.currentBalance').closest('.mem-financial-card').querySelector('.mem-balance-panel');
  expect(balanceRow.querySelector('bdi[dir="ltr"]')).toBeInTheDocument();
  expect(balanceRow.querySelector('.mem-balance-panel__value-currency')).toHaveTextContent('SAR');
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

test('the detail-header action menu uses the exact same trigger class as the list-row one -- one component/style family, not a separate size', () => {
  const detail = { member: { ...baseMember, capabilities: { can_remove: true } }, statistics: baseStatistics };
  renderDetail(detail, { onRole: jest.fn(), onRemove: jest.fn(), onTransfer: jest.fn(), onLeave: jest.fn(), onBan: jest.fn() });
  const trigger = screen.getByRole('button', { name: `members.details ${baseMember.display_name}` });
  expect(trigger).toHaveClass('member-actions-menu__trigger');
});

test('renders two separate cards -- a compact profile card and a Financial Record card -- not one oversized card', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  const { container } = renderDetail(detail);
  const profileCard = container.querySelector('.mem-profile-card');
  const financialCard = container.querySelector('.mem-financial-card');
  expect(profileCard).not.toBeNull();
  expect(financialCard).not.toBeNull();
  expect(profileCard).not.toBe(financialCard);
  expect(profileCard.contains(financialCard)).toBe(false);
});

test('the Financial Record card header shows the section title and "Current Balance" on the same row', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  const { container } = renderDetail(detail);
  const header = container.querySelector('.mem-financial-card__header');
  expect(header).toHaveTextContent('members.financialRecord');
  expect(header).toHaveTextContent('members.currentBalance');
});

test('the financial grid is one integrated region (internal borders), not separate floating mini-cards', () => {
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  const { container } = renderDetail(detail);
  const grids = container.querySelectorAll('.mem-financial-grid');
  expect(grids.length).toBe(1); // the personal-ledger grid; Fund's own grid only renders when there is Fund data
  expect(grids[0].tagName.toLowerCase()).toBe('dl');
});

test('falls back to showing identity type (never a fake email) when the server omits email', () => {
  const detail = { member: { ...baseMember, identity_type: 'guest', capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail);
  expect(screen.getByText('identity.guest')).toBeInTheDocument();
});

test('onBack, when provided, calls back on click', () => {
  const onBack = jest.fn();
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail, { onBack });
  fireEvent.click(screen.getByText('common.back'));
  expect(onBack).toHaveBeenCalled();
});

test('the back arrow icon carries a dedicated class for RTL mirroring, same as the rest of the app (never a hardcoded single-direction glyph)', () => {
  const onBack = jest.fn();
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  const { container } = renderDetail(detail, { onBack });
  const icon = container.querySelector('.mem-back i');
  expect(icon).toHaveClass('bi-arrow-left', 'mem-back__icon');
});

test('members.css mirrors the back arrow under RTL using the exact same recipe CreateTripPage/JoinTripPage already use ([dir="rtl"] + scaleX(-1)), not a bespoke direction system', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'members.css'), 'utf8');
  expect(css).toMatch(/\[dir=["']rtl["']\]\s*\.mem-back__icon\s*\{[^}]*transform:\s*scaleX\(-1\)/);
});

test('Back reuses the canonical dash-btn secondary component -- not a one-off Members-only button style', () => {
  const onBack = jest.fn();
  const detail = { member: { ...baseMember, capabilities: { can_settle_with: false } }, statistics: baseStatistics };
  renderDetail(detail, { onBack });
  const backButton = screen.getByText('common.back').closest('button');
  expect(backButton).toHaveClass('dash-btn', 'dash-btn--secondary');
});
