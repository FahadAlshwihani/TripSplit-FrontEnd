import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import GovernancePage from './GovernancePage';
import { banMember, getBans, getJoinRequests, kickMember, revokeBan } from '../api/governanceApi';
import { getInvitations } from '../../invitations/api/invitationsApi';
import { getMembers } from '../../members/api/membersApi';

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

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false, can_settle_with: false };
const moderatable = { id: 'm2', display_name: 'Regular', role: 'member', identity_type: 'registered', active: true, avatar: { type: 'initials', color: 'slate' }, capabilities: { ...noCaps, can_remove: true, can_ban: true } };

const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/t1/governance']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ tripId: 't1', permissions: { canManageMembers: true } }} />}>
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
        <Route path="/trips/:tripId" element={<Outlet context={{ tripId: 't1', permissions: { canManageMembers: false } }} />}>
          <Route path="governance" element={<GovernancePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText('governance.accessDenied')).toBeInTheDocument();
});
