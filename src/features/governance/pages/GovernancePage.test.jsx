import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import GovernancePage from './GovernancePage';
import { banMember, getBans, getJoinRequests, kickMember, revokeBan } from '../api/governanceApi';
import { createInvitation, getInvitations } from '../../invitations/api/invitationsApi';
import { getMembers } from '../../members/api/membersApi';
import { rotateJoinCode, updateTrip } from '../../trips/api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));
jest.mock('../api/governanceApi', () => ({
  getJoinRequests: jest.fn(),
  getBans: jest.fn(),
  kickMember: jest.fn(),
  banMember: jest.fn(),
  revokeBan: jest.fn(),
  reviewJoinRequest: jest.fn(),
}));
jest.mock('../../invitations/api/invitationsApi', () => ({
  getInvitations: jest.fn(),
  createInvitation: jest.fn(),
  resendInvitation: jest.fn(),
  revokeInvitation: jest.fn(),
}));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../trips/api/tripsApi', () => ({ updateTrip: jest.fn(), rotateJoinCode: jest.fn() }));

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false, can_settle_with: false };
const moderatable = { id: 'm2', display_name: 'Regular', role: 'member', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'slate' }, capabilities: { ...noCaps, can_remove: true, can_ban: true } };
const baseTrip = { currency: 'SAR', join_code: 'ABC12345', join_policy: 'open' };

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/governance']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip: jest.fn(), tripId: 't1', permissions: { canManageMembers: true }, ...ctxOverrides }} />}>
        <Route path="governance" element={<GovernancePage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getJoinRequests.mockResolvedValue({ results: [] });
  getInvitations.mockResolvedValue({ results: [] });
  getBans.mockResolvedValue({ results: [] });
  getMembers.mockResolvedValue({ results: [moderatable] });
});

test('kick requires confirming a dialog before the API is called', async () => {
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('governance.kick'));
  expect(kickMember).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('Regular');
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.kick' }));
  await waitFor(() => expect(kickMember).toHaveBeenCalledWith('t1', 'm2'));
});

test('ban opens a duration + reason dialog instead of banning immediately', async () => {
  banMember.mockResolvedValue({});
  renderPage();
  await screen.findByText('Regular');
  fireEvent.click(screen.getByText('governance.confirmBanAction'));
  expect(banMember).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('dialog', { name: /governance\.banTitle/ });
  fireEvent.change(within(dialog).getByLabelText('governance.banDuration'), { target: { value: '7d' } });
  fireEvent.change(within(dialog).getByLabelText('governance.banReason'), { target: { value: 'spam' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.confirmBanAction' }));
  await waitFor(() => expect(banMember).toHaveBeenCalledWith('t1', 'm2', { duration: '7d', reason: 'spam' }));
});

test('unban requires confirmation before revoking', async () => {
  getBans.mockResolvedValue({ results: [{ id: 'b1', active: true, member: { display_name: 'Banned Guy' }, expires_at: null }] });
  renderPage();
  await screen.findByText('governance.unban');
  fireEvent.click(screen.getByText('governance.unban'));
  expect(revokeBan).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('Banned Guy');
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.unban' }));
  await waitFor(() => expect(revokeBan).toHaveBeenCalledWith('t1', 'b1'));
});

test('governance access denial uses a localized message, not hardcoded English', async () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/governance']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip: jest.fn(), tripId: 't1', permissions: { canManageMembers: false } }} />}>
          <Route path="governance" element={<GovernancePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText('governance.accessDenied')).toBeInTheDocument();
});

test('toggling Require Approval PATCHes the trip join_policy, not a client-side guess', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, join_policy: 'approval_required' });
  renderPage();
  await screen.findByLabelText('governance.requireApproval');
  fireEvent.click(screen.getByLabelText('governance.requireApproval'));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { join_policy: 'approval_required' }));
});

test('turning the invite link off sends invite_only regardless of the approval toggle', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, join_policy: 'invite_only' });
  renderPage();
  await screen.findByLabelText('governance.inviteLinkActive');
  fireEvent.click(screen.getByLabelText('governance.inviteLinkActive'));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { join_policy: 'invite_only' }));
});

test('the invite link field and copy/rotate actions disappear once the link is off', async () => {
  renderPage({ trip: { ...baseTrip, join_policy: 'invite_only' } });
  await screen.findByLabelText('governance.inviteLinkActive');
  expect(screen.queryByText('governance.copyLink')).not.toBeInTheDocument();
  expect(screen.queryByText('governance.rotateLink')).not.toBeInTheDocument();
});

test('rotating the invite link requires confirmation before calling the API', async () => {
  rotateJoinCode.mockResolvedValue({ ...baseTrip, join_code: 'NEWCODE1' });
  renderPage();
  await screen.findByText('governance.rotateLink');
  fireEvent.click(screen.getByText('governance.rotateLink'));
  expect(rotateJoinCode).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.rotateLink' }));
  await waitFor(() => expect(rotateJoinCode).toHaveBeenCalledWith('t1'));
});

test('Add member opens the invite dialog and sends a real email invitation', async () => {
  createInvitation.mockResolvedValue({});
  renderPage();
  await screen.findByText('governance.addMember');
  fireEvent.click(screen.getByText('governance.addMember'));
  const dialog = await screen.findByRole('dialog', { name: 'governance.addMember' });
  fireEvent.change(within(dialog).getByLabelText('governance.inviteEmail'), { target: { value: 'friend@example.com' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.sendInvite' }));
  await waitFor(() => expect(createInvitation).toHaveBeenCalledWith('t1', { email: 'friend@example.com' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'governance.addMember' })).not.toBeInTheDocument());
});
