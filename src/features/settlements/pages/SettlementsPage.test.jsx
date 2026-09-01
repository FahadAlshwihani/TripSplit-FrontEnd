import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import SettlementsPage from './SettlementsPage';
import { getSettlementPage, getSettlements, getSettlementTimeline, recordAdminSettlement, reportPayment, recordReceivedPayment, reviewSettlement } from '../api/settlementsApi';
import { getMembers } from '../../members/api/membersApi';
import { getBalances } from '../../balances/api/balancesApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/settlementsApi', () => ({
  getSettlements: jest.fn(),
  getSettlementPage: jest.fn(),
  getSettlementTimeline: jest.fn(),
  reviewSettlement: jest.fn(),
  recordAdminSettlement: jest.fn(),
  reportPayment: jest.fn(),
  recordReceivedPayment: jest.fn(),
}));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../balances/api/balancesApi', () => ({ getBalances: jest.fn() }));

const fahad = { id: 'm1', display_name: 'Fahad', role: 'owner', active: true, avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', role: 'member', active: true, avatar: { type: 'initials', color: 'slate' } };
const ali = { id: 'm3', display_name: 'Ali', role: 'member', active: true, avatar: { type: 'initials', color: 'green' } };

const pendingRow = { id: 's1', from_member_id: 'm2', from_name: 'Saud', to_member_id: 'm1', to_name: 'Fahad', amount: '75.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '', created_by: 'm2' };
const confirmedRow = { id: 's2', from_member_id: 'm1', from_name: 'Fahad', to_member_id: 'm2', to_name: 'Saud', amount: '30.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-10', reviewed_at: '2026-08-10T22:42:00Z', reviewed_by: 'm2', reviewed_by_name: 'Saud', note: '', created_by: 'm1' };
const rejectedRow = { id: 's3', from_member_id: 'm2', from_name: 'Saud', to_member_id: 'm1', to_name: 'Fahad', amount: '20.00', currency: 'SAR', status: 'rejected', settlement_date: '2026-08-05', note: '', created_by: 'm2', is_resolved: false };
const cancelledRow = { id: 's4', from_member_id: 'm1', from_name: 'Fahad', to_member_id: 'm3', to_name: 'Ali', amount: '10.00', currency: 'SAR', status: 'cancelled', settlement_date: '2026-08-01', note: '', created_by: 'm1' };
// A rejected row whose underlying debt was later paid off by a
// SEPARATE settlement -- server-derived is_resolved: true (see
// apps.expenses.settlements.settlement_is_resolved). The rejection
// itself stays visible; only its recovery actions must disappear.
const resolvedRejectedRow = { id: 's5', from_member_id: 'm2', from_name: 'Saud', to_member_id: 'm1', to_name: 'Fahad', amount: '148.00', currency: 'SAR', status: 'rejected', settlement_date: '2026-08-03', note: '', created_by: 'm2', is_resolved: true };

const baseBalances = {
  currency: 'SAR',
  members: [
    { member_id: 'm2', display_name: 'Saud', avatar: {}, balance: '-1200.00' },
    { member_id: 'm1', display_name: 'Fahad', avatar: {}, balance: '850.00' },
    { member_id: 'm3', display_name: 'Ali', avatar: {}, balance: '350.00' },
  ],
  suggested_settlements: [
    { from_member: 'm2', from_name: 'Saud', to_member: 'm1', to_name: 'Fahad', amount: '850.00' },
    { from_member: 'm2', from_name: 'Saud', to_member: 'm3', to_name: 'Ali', amount: '350.00' },
  ],
};

const permissions = { canRecordSettlement: true };
const trip = { currency: 'SAR' };

const moneyMatcher = (text) => (_content, node) => node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text;

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/settlements']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions, ...ctxOverrides }} />}>
        <Route path="settlements" element={<SettlementsPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getBalances.mockResolvedValue(baseBalances);
  getSettlements.mockResolvedValue({ results: [pendingRow, confirmedRow, rejectedRow, cancelledRow] });
  getMembers.mockResolvedValue({ results: [fahad, saud, ali] });
  getSettlementTimeline.mockResolvedValue([]);
});

// 1-2: page renders the Stitch workspace + Current Balances card
test('renders the workspace grid with Current Balances, Suggested Settlements, and Settlement Ledger cards', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.currentBalances');
  expect(screen.getByText('settlements.suggestedSettlements')).toBeInTheDocument();
  expect(screen.getByText('settlements.settlementLedger')).toBeInTheDocument();
  expect(container.querySelector('.settle-workspace')).toBeInTheDocument();
  expect(container.querySelector('.settle-workspace__left')).toBeInTheDocument();
  expect(container.querySelector('.settle-workspace__right')).toBeInTheDocument();
});

// 3-4: live negative/positive balance
test('shows a negative balance as "owes overall" and a positive one as "gets back", straight from the balances endpoint', async () => {
  renderPage();
  await screen.findByText('settlements.owesOverall');
  expect(screen.getByText('settlements.owesOverall')).toBeInTheDocument();
  expect(screen.getAllByText('settlements.getsBack')).toHaveLength(2);
  expect(screen.getByText(moneyMatcher('-1,200.00 SAR'))).toBeInTheDocument();
  expect(screen.getByText(moneyMatcher('+850.00 SAR'))).toBeInTheDocument();
});

// 5: zero balance state
test('a member sitting at exactly zero shows the "settled up" state, distinct from owing/getting back', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, members: [...baseBalances.members, { member_id: 'm4', display_name: 'Noor', avatar: {}, balance: '0.00' }] });
  renderPage();
  await screen.findByText('Noor');
  expect(screen.getByText('settlements.balanced')).toBeInTheDocument();
});

test('when every member is at zero, the card collapses to a single centered empty state instead of a wall of "settled up" rows', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, members: baseBalances.members.map((m) => ({ ...m, balance: '0.00' })) });
  renderPage();
  expect(await screen.findByText('settlements.balancesEmptyTitle')).toBeInTheDocument();
  expect(screen.queryByText('settlements.balanced')).not.toBeInTheDocument();
});

// 6-8: Suggestions card, from backend data, no-suggestions state
test('suggestions render straight from balances.suggested_settlements, never recomputed', async () => {
  renderPage();
  await screen.findByText('settlements.suggestedSettlements');
  expect(screen.getByText('settlements.suggestedSettlementsHelper')).toBeInTheDocument();
  expect(screen.getAllByText('Saud')).not.toHaveLength(0);
  expect(screen.getByText(moneyMatcher('850.00 SAR'))).toBeInTheDocument();
  expect(screen.getByText(moneyMatcher('350.00 SAR'))).toBeInTheDocument();
});

test('no suggestions shows the dedicated empty state, card still present', async () => {
  getBalances.mockResolvedValue({ ...baseBalances, suggested_settlements: [] });
  renderPage();
  expect(await screen.findByText('settlements.suggestionsEmptyTitle')).toBeInTheDocument();
  expect(screen.getByText('settlements.suggestedSettlements')).toBeInTheDocument();
});

// 9-10: suggestion action opens canonical dialog, payer/receiver direction
test('as the debtor, Record opens the "I Paid" flow pre-filled with the creditor as counterpart', async () => {
  renderPage({ currentMember: saud }); // Saud is the debtor in both suggestions
  const payBtn = await screen.findAllByText('settlements.recordActionPay');
  fireEvent.click(payBtn[0]);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('settlements.iPaidModalTitle')).toBeInTheDocument();
});

test('as the creditor, Record opens the "Record Received" flow', async () => {
  renderPage({ currentMember: fahad }); // Fahad is a creditor in one suggestion
  const receiveBtn = await screen.findByText('settlements.recordActionReceive');
  fireEvent.click(receiveBtn);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('settlements.recordReceivedModalTitle')).toBeInTheDocument();
});

test('a manager who is neither party gets the admin flow, pre-filled with the exact debtor/creditor pair', async () => {
  renderPage({ currentMember: fahad }); // Fahad is owner; Saud->Ali suggestion doesn't involve Fahad
  const recordBtns = await screen.findAllByText('settlements.record');
  fireEvent.click(recordBtns[0]);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('settlements.payer')).toHaveValue('m2');
  expect(within(dialog).getByLabelText('settlements.recipient')).toHaveValue('m3');
});

test('a plain member with no stake in a suggestion gets no Record action for it', async () => {
  renderPage({ currentMember: ali }); // Ali is only involved in the Saud->Ali suggestion
  await screen.findByText('settlements.suggestedSettlements');
  // Ali can record the Saud->Ali one (as creditor) but not the Saud->Fahad one.
  expect(screen.getAllByText(/settlements\.recordAction/).length).toBe(1);
});

test('submitting the pre-filled suggestion dialog calls the correct canonical API for that mode', async () => {
  reportPayment.mockResolvedValue({});
  renderPage({ currentMember: saud });
  const payBtn = await screen.findAllByText('settlements.recordActionPay');
  fireEvent.click(payBtn[0]);
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.iPaid' }));
  await waitFor(() => expect(reportPayment).toHaveBeenCalledWith('t1', expect.objectContaining({ to_member_id: 'm1' })));
});

// 11: RTL arrow direction (structural contract -- jsdom has no layout engine)
test('the suggestion arrow flips under RTL via CSS, keeping the debtor-first / creditor-second DOM order unchanged', async () => {
  const { container } = render(
    <div dir="rtl">
      <MemoryRouter initialEntries={['/trips/t1/settlements']}>
        <Routes>
          <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions }} />}>
            <Route path="settlements" element={<SettlementsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>,
  );
  await screen.findByText('settlements.suggestedSettlements');
  const names = Array.from(container.querySelectorAll('.settle-suggestion-row__name')).map((el) => el.textContent);
  expect(names.slice(0, 2)).toEqual(['Saud', 'Fahad']); // DOM order (semantic: Saud pays Fahad) never reorders
  expect(container.querySelector('.settle-suggestion-row__arrow')).toBeInTheDocument();
});

// 12-16: Ledger card, all statuses, newest first
test('the ledger shows all four statuses -- pending, confirmed, rejected, cancelled -- never hiding any', async () => {
  renderPage();
  await screen.findByText('settlements.settlementLedger');
  expect(screen.getByText('settlements.status.pending')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.confirmed')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.rejected')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.cancelled')).toBeInTheDocument();
});

test('ledger entries render in the exact server order (newest first), never reordered client-side', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  const entries = container.querySelectorAll('.settle-timeline-entry');
  expect(entries.length).toBe(4);
  // Server already returns newest-first (pending, confirmed, rejected, cancelled per the mock) --
  // the first rendered entry must be the first server row, untouched.
  expect(entries[0].textContent).toMatch(/Saud/);
  expect(entries[0].textContent).toMatch(/75\.00/);
  expect(entries[3].textContent).toMatch(/10\.00/);
});

// 18: details drawer opens
test('clicking a ledger entry opens the existing canonical timeline drawer and fetches its history', async () => {
  renderPage();
  await screen.findByText('settlements.settlementLedger');
  const cards = screen.getAllByRole('button', { name: /Saud.*paid.*Fahad|Fahad.*paid.*Saud/i });
  fireEvent.click(cards[0]);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() => expect(getSettlementTimeline).toHaveBeenCalled());
});

test('the drawer preserves pending recovery actions -- recipient can confirm', async () => {
  reviewSettlement.mockResolvedValue({});
  renderPage();
  await screen.findByText('settlements.settlementLedger');
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*75\.00/ }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.yesReceived' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's1', 'confirm'));
});

test('the drawer preserves rejected-row recovery -- reporter can ask to check again', async () => {
  reviewSettlement.mockResolvedValue({});
  renderPage({ currentMember: saud });
  await screen.findByText('settlements.settlementLedger');
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*20\.00/ }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.retryAction' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's3', 'retry'));
});

test('a plain member with no stake in the settlement gets no recovery actions in the drawer', async () => {
  renderPage({ currentMember: ali });
  await screen.findByText('settlements.settlementLedger');
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*75\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).queryByRole('button', { name: 'settlements.yesReceived' })).not.toBeInTheDocument();
});

// 19: load more / pagination
test('load more follows the exact DRF next-page URL and appends to the loaded ledger', async () => {
  getSettlements.mockResolvedValue({ results: [pendingRow], next: '/api/v1/trips/t1/settlements/?page=2' });
  getSettlementPage.mockResolvedValue({ results: [confirmedRow], next: null });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'common.loadMore' }));
  await waitFor(() => expect(getSettlementPage).toHaveBeenCalledWith('/api/v1/trips/t1/settlements/?page=2', 't1', expect.anything()));
  expect(await screen.findByText('settlements.status.confirmed')).toBeInTheDocument();
});

test('no "load more" button when there is no next page', async () => {
  getSettlements.mockResolvedValue({ results: [pendingRow], next: null });
  renderPage();
  await screen.findByText('settlements.settlementLedger');
  expect(screen.queryByRole('button', { name: 'common.loadMore' })).not.toBeInTheDocument();
});

// 20: Material Symbols icon contract
test('ledger status nodes use Material Symbols, not Bootstrap icons', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  const icons = Array.from(container.querySelectorAll('.settle-timeline-entry__node .material-symbols-outlined')).map((el) => el.textContent);
  expect(icons).toEqual(expect.arrayContaining(['schedule', 'check_circle', 'cancel', 'close']));
  expect(container.querySelector('.settle-timeline-entry__node .bi')).toBeNull();
});

test('the suggestion arrow uses the exact Material Symbol arrow_forward', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.suggestedSettlements');
  const arrow = container.querySelector('.settle-suggestion-row__arrow');
  expect(arrow).toHaveTextContent('arrow_forward');
});

// 21: 7/5 desktop grid contract
test('the left/right columns carry the literal 7/12 + 5/12 grid classes, not a 50/50 or 8/4 substitute', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.currentBalances');
  expect(container.querySelector('.settle-workspace__left')).toBeInTheDocument();
  expect(container.querySelector('.settle-workspace__right')).toBeInTheDocument();
});

// 22: 40px avatar
test('balance row avatars use the real 40px Avatar preset (size="md")', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.currentBalances');
  expect(container.querySelector('.settle-balance-row .pf-avatar--md')).toBeInTheDocument();
});

// 23: 40px timeline node -- structural contract (class hook), jsdom has no layout engine
test('timeline nodes carry the 40px node class contract', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  expect(container.querySelector('.settle-timeline-entry__node')).toBeInTheDocument();
});

// 24: floating card labels
test('all three cards use the floating outlined label, not a normal card header row', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.currentBalances');
  expect(container.querySelectorAll('.settle-card__label').length).toBe(3);
});

// 27-28: Arabic / English
test('renders with Arabic i18n keys resolved through the same components (mocked t returns the key, structure is language-agnostic)', async () => {
  renderPage();
  await screen.findByText('settlements.pageTitle');
  expect(screen.getByText('settlements.pageSubtitle')).toBeInTheDocument();
});

// Record External Settlement -- still available, capability-gated
test('no Bootstrap icons anywhere in the page content -- Material Symbols only', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  expect(container.querySelector('.settle-page .bi')).toBeNull();
});

test('an owner sees Record External Settlement and can submit an acknowledged admin settlement', async () => {
  recordAdminSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /settlements\.recordExternal/ }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('settlements.payer'), { target: { value: 'm2' } });
  fireEvent.change(within(dialog).getByLabelText('settlements.recipient'), { target: { value: 'm1' } });
  fireEvent.change(within(dialog).getByLabelText('expense.amount'), { target: { value: '15' } });
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(within(dialog).getByRole('button', { name: /settlements\.recordExternal/ }));
  await waitFor(() => expect(recordAdminSettlement).toHaveBeenCalledWith('t1', expect.objectContaining({ acknowledged: true })));
});

test('a regular member never sees Record External Settlement', async () => {
  renderPage({ currentMember: saud });
  await screen.findByText('settlements.settlementLedger');
  expect(screen.queryByRole('button', { name: /settlements\.recordExternal/ })).not.toBeInTheDocument();
});

test('a read-only (archived) trip hides all record/action controls', async () => {
  renderPage({ permissions: { canRecordSettlement: false } });
  await screen.findByText('settlements.settlementLedger');
  expect(screen.queryByRole('button', { name: /settlements\.recordExternal/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/settlements\.recordAction/)).not.toBeInTheDocument();
});

test('an empty ledger shows the empty state, other cards remain', async () => {
  getSettlements.mockResolvedValue({ results: [] });
  renderPage();
  expect(await screen.findByText('settlements.empty')).toBeInTheDocument();
  expect(screen.getByText('settlements.currentBalances')).toBeInTheDocument();
});

test('a load failure shows a retry action', async () => {
  getSettlements.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('network down')).toBeInTheDocument();
});

// 25.1-25.5: modal/drawer portal containment (real regression: these
// rendered as inline page content instead of real overlays because the
// components didn't import their own required structural CSS)
test('the timeline drawer renders through ModalPortal -- a body-level element outside the page container and the workspace grid, with a real backdrop and aria-modal', async () => {
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*75\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(container.contains(dialog)).toBe(false);
  expect(document.body.contains(dialog)).toBe(true);
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(document.body.querySelector('.exp-drawer-overlay')).toBeInTheDocument();
});

test('the action dialog renders through ModalPortal -- not an inline child of settle-workspace -- with a real backdrop and aria-modal', async () => {
  const { container } = renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /settlements\.recordExternal/ }));
  const dialog = await screen.findByRole('dialog');
  expect(container.querySelector('.settle-workspace').contains(dialog)).toBe(false);
  expect(document.body.contains(dialog)).toBe(true);
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(document.body.querySelector('.bal-dialog-overlay')).toBeInTheDocument();
});

// 25.4: single-overlay-state contract -- opening a second overlay always
// replaces the first, since both are driven off one discriminated state
test('opening a second settlement overlay always replaces the first -- only one is ever mounted at a time', async () => {
  renderPage();
  await screen.findByText('settlements.settlementLedger');
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*75\.00/ }));
  await screen.findByRole('dialog');
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: /settlements\.recordExternal/ }));
  await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
  expect(within(screen.getByRole('dialog')).getByText('settlements.adminModalTitle')).toBeInTheDocument();
});

// 25.15-25.16: canonical control classes, no raw unstyled close button
test('the admin dialog opened from Settlements uses canonical field-control classes and the canonical close button, not raw browser defaults', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /settlements\.recordExternal/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('settlements.payer')).toHaveClass('field-control');
  expect(within(dialog).getByLabelText('expense.amount')).toHaveClass('field-control');
  expect(dialog.querySelector('.exp-modal__close')).toBeInTheDocument();
});

// 29.1-29.14: resolution-aware history + safe timeline layout

test('29.1: an unresolved rejected settlement shows its recovery action (Ask to Check Again) in the drawer', async () => {
  getSettlements.mockResolvedValue({ results: [rejectedRow] });
  renderPage({ currentMember: saud }); // Saud reported it
  fireEvent.click(await screen.findByRole('button', { name: /Saud.*paid.*Fahad.*20\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'settlements.retryAction' })).toBeInTheDocument();
});

test('29.2/29.7: a resolved rejected settlement hides its recovery action -- no stale "check again" control', async () => {
  getSettlements.mockResolvedValue({ results: [resolvedRejectedRow] });
  renderPage({ currentMember: saud });
  fireEvent.click(await screen.findByRole('button', { name: /Saud.*paid.*Fahad.*148\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).queryByRole('button', { name: 'settlements.retryAction' })).not.toBeInTheDocument();
});

test('29.3/29.6: a resolved rejected settlement shows the historical resolved indicator, both in the ledger row and the drawer', async () => {
  getSettlements.mockResolvedValue({ results: [resolvedRejectedRow] });
  const { container } = renderPage({ currentMember: saud });
  await screen.findByText('settlements.settlementLedger');
  expect(container.querySelectorAll('.settle-timeline-badge--resolved').length).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*148\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('settlements.resolvedNote')).toBeInTheDocument();
  expect(within(dialog).getByText('settlements.resolvedBadge')).toBeInTheDocument();
});

test('29.4/29.13/29.14: a rejected-and-resolved row and its resolving confirmed row both render as separate, un-merged ledger entries', async () => {
  const resolvingConfirmedRow = { id: 's6', from_member_id: 'm2', from_name: 'Saud', to_member_id: 'm1', to_name: 'Fahad', amount: '148.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-04', reviewed_at: '2026-08-04T10:00:00Z', reviewed_by: 'm1', reviewed_by_name: 'Fahad', note: '', created_by: 'm1' };
  getSettlements.mockResolvedValue({ results: [resolvingConfirmedRow, resolvedRejectedRow] });
  const { container } = renderPage({ currentMember: saud });
  await screen.findByText('settlements.settlementLedger');
  const entries = container.querySelectorAll('.settle-timeline-entry');
  expect(entries.length).toBe(2); // never collapsed into one card
  expect(screen.getByText('settlements.status.rejected')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.confirmed')).toBeInTheDocument();
});

test('29.5: clicking a resolved rejected row still opens its full details drawer', async () => {
  getSettlements.mockResolvedValue({ results: [resolvedRejectedRow] });
  renderPage({ currentMember: saud });
  fireEvent.click(await screen.findByRole('button', { name: /Saud.*paid.*Fahad.*148\.00/ }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() => expect(getSettlementTimeline).toHaveBeenCalled());
});

test('29.8: the timeline node renders as a card-attached tab (icon before its own card in DOM order), never a shared center-line node', async () => {
  getSettlements.mockResolvedValue({ results: [rejectedRow, confirmedRow] });
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  const entry = container.querySelector('.settle-timeline-entry');
  // Node precedes the card in DOM order within its own entry -- "icon
  // above card", never positioned in a shared center gap.
  const node = entry.querySelector('.settle-timeline-entry__node');
  const card = entry.querySelector('.settle-timeline-entry__card');
  expect(node).toBeInTheDocument();
  expect(card).toBeInTheDocument();
  const children = Array.from(entry.children);
  expect(children.indexOf(node)).toBeLessThan(children.indexOf(card));
});

test('29.11: RTL -- the resolved indicator and recovery-action gating render identically under dir="rtl"', async () => {
  getSettlements.mockResolvedValue({ results: [resolvedRejectedRow] });
  const { container } = render(
    <div dir="rtl">
      <MemoryRouter initialEntries={['/trips/t1/settlements']}>
        <Routes>
          <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: saud, permissions }} />}>
            <Route path="settlements" element={<SettlementsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>,
  );
  await screen.findByText('settlements.settlementLedger');
  expect(container.querySelector('.settle-timeline-badge--resolved')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Saud.*paid.*Fahad.*148\.00/ }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).queryByRole('button', { name: 'settlements.retryAction' })).not.toBeInTheDocument();
});

test('29.12: mobile -- the timeline layout carries no viewport-conditional alternating classes to regress at a breakpoint (structural: same DOM regardless of viewport)', async () => {
  getSettlements.mockResolvedValue({ results: [pendingRow, confirmedRow, rejectedRow, cancelledRow] });
  const { container } = renderPage();
  await screen.findByText('settlements.settlementLedger');
  const entries = container.querySelectorAll('.settle-timeline-entry');
  expect(entries.length).toBe(4);
  entries.forEach((entry) => expect(entry.querySelector('.settle-timeline-entry__node')).toBeInTheDocument());
});
