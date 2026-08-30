import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import MembersPage from './MembersPage';
import { getMemberDetail, getMembers, leaveTrip, removeMember, transferOwnership, updateMember } from '../api/membersApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));
jest.mock('../api/membersApi', () => ({
  getMembers: jest.fn(),
  getMemberDetail: jest.fn(),
  updateMember: jest.fn(),
  removeMember: jest.fn(),
  leaveTrip: jest.fn(),
  transferOwnership: jest.fn(),
}));

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_transfer_ownership: false, can_settle_with: false };
const owner = { id: 'owner1', display_name: 'Owner', role: 'owner', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'indigo' }, capabilities: noCaps };
const regular = { id: 'm2', display_name: 'Regular', role: 'member', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'slate' }, capabilities: { ...noCaps, can_promote: true, can_remove: true } };

const trip = { currency: 'SAR' };
const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/t1/members']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: owner, permissions: { canManageMembers: true } }} />}>
        <Route path="members" element={<MembersPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getMembers.mockResolvedValue({ results: [owner, regular] });
});

test('promote never fires immediately -- it requires confirming a dialog first', async () => {
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.promote'));
  expect(updateMember).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.promote' }));
  await waitFor(() => expect(updateMember).toHaveBeenCalledWith('t1', 'm2', { role: 'admin' }));
});

test('cancelling the confirm dialog never calls the API', async () => {
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.promote'));
  await screen.findByRole('alertdialog');
  fireEvent.click(screen.getByText('common.cancel'));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(updateMember).not.toHaveBeenCalled();
});

test('remove fetches the member statistics first and warns when a financial balance is still open', async () => {
  getMemberDetail.mockResolvedValue({ member: regular, statistics: { current_balance: '42.00' } });
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.remove'));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('members.confirmRemoveFinancial');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.confirmRemoveAnyway' }));
  await waitFor(() => expect(removeMember).toHaveBeenCalledWith('t1', 'm2'));
});

test('remove does not warn about finances when the balance is zero', async () => {
  getMemberDetail.mockResolvedValue({ member: regular, statistics: { current_balance: '0.00' } });
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.remove'));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).not.toHaveTextContent('members.confirmRemoveFinancial');
});

test('leave trip requires confirmation and navigates away only after confirming', async () => {
  leaveTrip.mockResolvedValue(undefined);
  const ownerAsMember = { ...owner, role: 'member' };
  render(
    <MemoryRouter initialEntries={['/trips/t1/members']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: ownerAsMember, permissions: { canManageMembers: true } }} />}>
          <Route path="members" element={<MembersPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.leave'));
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
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('members.transfer'));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('Regular');
  fireEvent.click(within(dialog).getByRole('button', { name: 'members.transfer' }));
  await waitFor(() => expect(transferOwnership).toHaveBeenCalledWith('t1', 'm2'));
});
