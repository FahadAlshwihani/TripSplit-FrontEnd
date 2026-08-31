import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import MembersPage from './MembersPage';
import { getAllMembers, getMemberDetail, getMembers, leaveTrip, removeMember, transferOwnership, updateMember } from '../api/membersApi';
import { getBalances } from '../../balances/api/balancesApi';
import { banMember } from '../../governance/api/governanceApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));
jest.mock('../api/membersApi', () => ({
  getMembers: jest.fn(),
  getAllMembers: jest.fn(),
  getMemberDetail: jest.fn(),
  updateMember: jest.fn(),
  removeMember: jest.fn(),
  leaveTrip: jest.fn(),
  transferOwnership: jest.fn(),
}));
jest.mock('../../balances/api/balancesApi', () => ({ getBalances: jest.fn() }));
jest.mock('../../governance/api/governanceApi', () => ({ banMember: jest.fn() }));

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false, can_settle_with: false };
const owner = { id: 'owner1', display_name: 'Owner', role: 'owner', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'indigo' }, capabilities: noCaps };
const regular = { id: 'm2', display_name: 'Regular', role: 'member', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'slate' }, capabilities: { ...noCaps, can_promote: true, can_remove: true, can_ban: true } };
const baseStatistics = { total_paid: '0', total_expense_share: '0', total_personal_spending: '0', settlements_sent: '0', settlements_received: '0', current_balance: '0.00', expense_count: 0, last_activity_at: null, fund: { contributed: '0', reimbursed: '0' } };

const trip = { currency: 'SAR' };
const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/members']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: owner, permissions: { canManageMembers: true }, ...ctxOverrides }} />}>
        <Route path="members" element={<MembersPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const openRowMenu = async (name) => {
  const trigger = await screen.findByRole('button', { name: `members.details ${name}` });
  fireEvent.click(trigger);
};

beforeEach(() => {
  jest.clearAllMocks();
  getMembers.mockResolvedValue({ results: [owner, regular] });
  getBalances.mockResolvedValue({ members: [] });
  getMemberDetail.mockResolvedValue({ member: { ...owner, capabilities: noCaps }, statistics: baseStatistics });
});

test('shows the canonical NeoLoading state while members are loading, never the old full-screen loader', () => {
  getMembers.mockReturnValue(new Promise(() => {})); // never resolves -- stays in the loading state
  renderPage();
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByText('common.loading')).toBeInTheDocument();
});

describe('mobile flow: selecting a default member must never, by itself, force the detail view open', () => {
  test('detailOpen stays false even after the default-selected member\'s detail data has fully loaded (the exact bug this pass fixes)', async () => {
    const { container } = renderPage();
    await screen.findByText('Regular');
    // The default-select effect already picked the current viewer and
    // its detail data has finished loading -- but that is a DATA
    // concern (member_detail_view populated `detail`), never a
    // navigation/UI concern. `detailOpen` (the class driving the mobile
    // single-surface swap) must stay false until the user actually taps
    // a row -- selectedId != null is not the same state as "the user
    // opened detail".
    await screen.findByText('members.currentBalance');
    expect(container.querySelector('.mem-layout')).not.toHaveClass('mem-layout--detail-open');
  });

  test('tapping a member row opens detail; tapping Back returns to the list-only state', async () => {
    const { container } = renderPage();
    await screen.findByText('Regular');
    await screen.findByText('members.currentBalance');
    fireEvent.click(screen.getByText('Regular'));
    await waitFor(() => expect(container.querySelector('.mem-layout')).toHaveClass('mem-layout--detail-open'));
    fireEvent.click(screen.getByText('common.back'));
    expect(container.querySelector('.mem-layout')).not.toHaveClass('mem-layout--detail-open');
  });

  test('the canonical Back control (dash-btn secondary + bi-arrow-left) is what closes detail, not a one-off Members-only button', async () => {
    renderPage();
    await screen.findByText('Regular');
    await screen.findByText('members.currentBalance');
    fireEvent.click(screen.getByText('Regular'));
    const back = await screen.findByText('common.back');
    const backButton = back.closest('button');
    expect(backButton).toHaveClass('dash-btn', 'dash-btn--secondary', 'mem-back');
  });
});

test('selecting a member loads their detail panel from the canonical member_detail_view response', async () => {
  getMemberDetail.mockResolvedValue({ member: { ...regular, capabilities: noCaps }, statistics: { ...baseStatistics, expense_count: 3 } });
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('Regular'));
  await waitFor(() => expect(getMemberDetail).toHaveBeenCalledWith('t1', 'm2'));
});

test('promote never fires immediately -- it requires opening the row menu and confirming a dialog', async () => {
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.promote' }));
  expect(updateMember).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.promote' }));
  await waitFor(() => expect(updateMember).toHaveBeenCalledWith('t1', 'm2', { role: 'admin' }));
});

test('cancelling the confirm dialog never calls the API', async () => {
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.promote' }));
  await screen.findByRole('alertdialog');
  fireEvent.click(screen.getByText('common.cancel'));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(updateMember).not.toHaveBeenCalled();
});

test('remove fetches the member statistics first and warns when a financial balance is still open', async () => {
  getMemberDetail.mockImplementation((tripId, memberId) => Promise.resolve(
    memberId === 'm2'
      ? { member: { ...regular, capabilities: noCaps }, statistics: { ...baseStatistics, current_balance: '42.00' } }
      : { member: { ...owner, capabilities: noCaps }, statistics: baseStatistics },
  ));
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.remove' }));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('members.confirmRemoveFinancial');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.confirmRemoveAnyway' }));
  await waitFor(() => expect(removeMember).toHaveBeenCalledWith('t1', 'm2'));
});

test('remove does not warn about finances when the balance is zero', async () => {
  getMemberDetail.mockImplementation((tripId, memberId) => Promise.resolve(
    memberId === 'm2'
      ? { member: { ...regular, capabilities: noCaps }, statistics: { ...baseStatistics, current_balance: '0.00' } }
      : { member: { ...owner, capabilities: noCaps }, statistics: baseStatistics },
  ));
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.remove' }));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).not.toHaveTextContent('members.confirmRemoveFinancial');
});

test('leave trip requires confirmation and navigates away only after confirming', async () => {
  leaveTrip.mockResolvedValue(undefined);
  const ownerAsMember = { ...owner, role: 'member' };
  renderPage({ currentMember: ownerAsMember });
  await openRowMenu('Owner');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.leave' }));
  const dialog = await screen.findByRole('alertdialog');
  expect(leaveTrip).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.leave' }));
  await waitFor(() => expect(leaveTrip).toHaveBeenCalledWith('t1'));
});

test('a member with can_transfer_ownership shows a confirmation naming the new owner', async () => {
  transferOwnership.mockResolvedValue(undefined);
  const transferable = { ...regular, capabilities: { ...noCaps, can_transfer_ownership: true } };
  getMembers.mockResolvedValue({ results: [owner, transferable] });
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'members.transfer' }));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('Regular');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.transfer' }));
  await waitFor(() => expect(transferOwnership).toHaveBeenCalledWith('t1', 'm2'));
});

test('banning from the Members action menu opens the real ban dialog, not an instant ban', async () => {
  banMember.mockResolvedValue({});
  renderPage();
  await openRowMenu('Regular');
  fireEvent.click(await screen.findByRole('menuitem', { name: 'governance.confirmBanAction' }));
  expect(banMember).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('dialog', { name: /governance\.banTitle/ });
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.confirmBanAction' }));
  await waitFor(() => expect(banMember).toHaveBeenCalledWith('t1', 'm2', { duration: '24h', reason: '' }));
});

test('checking "show historical" refetches through getAllMembers, not the active-only endpoint', async () => {
  const leftMember = { ...regular, id: 'm3', display_name: 'LeftPerson', active: false, capabilities: noCaps };
  getAllMembers.mockResolvedValue({ results: [owner, regular, leftMember] });
  renderPage();
  await screen.findByText('Regular');
  expect(getAllMembers).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('members.showHistorical'));
  await screen.findByText('LeftPerson');
  expect(getAllMembers).toHaveBeenCalledWith('t1', expect.anything());
});
