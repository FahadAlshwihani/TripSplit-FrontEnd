import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import GovernancePage from './GovernancePage';
import { getBans, getJoinRequests, revokeBan } from '../api/governanceApi';
import { createInvitation, getInvitations } from '../../invitations/api/invitationsApi';
import { rotateJoinCode, updateTrip } from '../../trips/api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));
jest.mock('../api/governanceApi', () => ({
  getJoinRequests: jest.fn(),
  getBans: jest.fn(),
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
jest.mock('../../trips/api/tripsApi', () => ({ updateTrip: jest.fn(), rotateJoinCode: jest.fn() }));

const fullCapabilities = { can_view_governance: true, can_review_join_requests: true, can_invite: true, can_resend_invite: true, can_revoke_invite: true, can_manage_bans: true, can_unban: true, can_manage_invite_link: true, can_manage_approval_setting: true };
const baseTrip = { title: 'Trip', currency: 'SAR', join_code: 'ABC12345', join_policy: 'open', governance_capabilities: fullCapabilities };

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/governance']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip: jest.fn(), tripId: 't1', ...ctxOverrides }} />}>
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

test('governance access denial uses a localized message, not hardcoded English -- driven by the server capability, never a client role guess', async () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/governance']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip: { ...baseTrip, governance_capabilities: { ...fullCapabilities, can_view_governance: false } }, setTrip: jest.fn(), tripId: 't1' }} />}>
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

test('a viewer without can_invite never sees the Invite action', async () => {
  renderPage({ trip: { ...baseTrip, governance_capabilities: { ...fullCapabilities, can_invite: false } } });
  await screen.findByText('governance.title');
  expect(screen.queryByText('governance.addMember')).not.toBeInTheDocument();
});
