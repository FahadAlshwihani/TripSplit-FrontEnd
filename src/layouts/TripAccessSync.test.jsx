import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TripLayout from './TripLayout';
import TripSettingsPage from '../features/trips/pages/TripSettingsPage';
import GovernancePage from '../features/governance/pages/GovernancePage';
import { getTrip, updateTrip } from '../features/trips/api/tripsApi';
import { getBans, getJoinRequests } from '../features/governance/api/governanceApi';
import { getInvitations } from '../features/invitations/api/invitationsApi';

/*
  The core invariant this pass exists to guarantee: Settings and
  Governance are two presentation surfaces over ONE canonical
  Trip.join_policy, not two independent settings systems. There is no
  cache/invalidation mechanism to test here beyond React Router's own
  Outlet context -- TripLayout owns `trip` state exactly once
  (useRouteResource), stays MOUNTED across a Settings<->Governance
  route change (both are sibling child routes of the same
  /trips/:tripId layout route, navigated between via DashboardShell's
  own real nav links -- never a remount of the whole tree), and hands
  the identical state to whichever child is currently rendered. A
  mutation from either page calls the same setTrip() this layout
  already exposes, so the other page sees it immediately on its next
  render -- no full page reload, no stale contradiction, no extra
  cache layer, by construction of the component tree itself.
*/
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' }, isAuthenticated: true, authLoading: false }) }));
jest.mock('../components/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', setTheme: jest.fn() }) }));
jest.mock('../features/trips/api/tripsApi', () => ({
  getTrip: jest.fn(),
  updateTrip: jest.fn(),
  rotateJoinCode: jest.fn(),
  archiveTrip: jest.fn(),
  restoreTrip: jest.fn(),
}));
jest.mock('../features/governance/api/governanceApi', () => ({
  getJoinRequests: jest.fn(), getBans: jest.fn(), reviewJoinRequest: jest.fn(), revokeBan: jest.fn(),
}));
jest.mock('../features/invitations/api/invitationsApi', () => ({
  getInvitations: jest.fn(), createInvitation: jest.fn(), resendInvitation: jest.fn(), revokeInvitation: jest.fn(),
}));
jest.mock('../shared/components/CurrencyPicker', () => ({ id, value, onChange, label }) => (
  <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="SAR">SAR</option>
  </select>
));

const owner = { id: 'm1', role: 'owner', identity_type: 'registered', display_name: 'Fahad', avatar: {} };

const baseTrip = {
  id: 'uuid-1', short_code: 'short-1', title: 'Georgia Winter Trip', join_code: 'ABCD1234',
  currency: 'SAR', currency_locked: false, start_date: null, end_date: null,
  join_policy: 'approval_required', password_protected: false,
  archived_at: null, lifecycle_status: 'active', current_member: owner,
  governance_capabilities: {
    can_view_governance: true, can_review_join_requests: true, can_invite: true, can_resend_invite: true,
    can_revoke_invite: true, can_manage_bans: true, can_unban: true, can_manage_invite_link: true, can_manage_approval_setting: true,
  },
};

const renderApp = (initialPath) => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/trips/:tripId" element={<TripLayout />}>
        <Route path="settings" element={<TripSettingsPage />} />
        <Route path="governance" element={<GovernancePage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const goTo = async (labelKey) => {
  const links = screen.getAllByRole('link', { name: new RegExp(labelKey) });
  fireEvent.click(links[0]);
};

beforeEach(() => {
  jest.clearAllMocks();
  getTrip.mockResolvedValue(baseTrip);
  getJoinRequests.mockResolvedValue({ results: [] });
  getBans.mockResolvedValue({ results: [] });
  getInvitations.mockResolvedValue({ results: [] });
});

test('changing join policy in Settings is immediately reflected in Governance after real client-side navigation, no reload/refetch needed', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, join_policy: 'open' });
  renderApp('/trips/short-1/settings');

  await screen.findAllByText('Georgia Winter Trip');
  expect(screen.getByLabelText(/^joinPolicy\.approval_required/)).toBeChecked();

  fireEvent.click(screen.getByLabelText(/^joinPolicy\.open/));
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('uuid-1', { join_policy: 'open' }));

  // Real in-app navigation -- clicks DashboardShell's own nav link,
  // TripLayout never unmounts.
  await goTo('dashboard.nav.governance');
  await screen.findByText('governance.title');
  expect(getTrip).toHaveBeenCalledTimes(1); // no second bootstrap fetch was needed
  expect(screen.getByLabelText('governance.inviteLinkActive')).toBeChecked();
  expect(screen.getByLabelText('governance.requireApproval')).not.toBeChecked();
});

test('the full round trip: Settings -> Governance -> Settings converges on the value set from Governance, via real navigation both ways', async () => {
  updateTrip.mockImplementation((id, payload) => Promise.resolve({ ...baseTrip, ...payload }));
  renderApp('/trips/short-1/settings');
  await screen.findAllByText('Georgia Winter Trip');

  await goTo('dashboard.nav.governance');
  await screen.findByText('governance.title');
  // approval_required -> disable the invite link entirely (invite_only).
  fireEvent.click(screen.getByLabelText('governance.inviteLinkActive'));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('uuid-1', { join_policy: 'invite_only' }));

  await goTo('dashboard.nav.settings');
  await screen.findByLabelText(/^joinPolicy\.invite_only/);
  expect(screen.getByLabelText(/^joinPolicy\.invite_only/)).toBeChecked();
  expect(screen.getByLabelText(/^joinPolicy\.open/)).not.toBeChecked();
  expect(screen.getByLabelText(/^joinPolicy\.approval_required/)).not.toBeChecked();
  expect(getTrip).toHaveBeenCalledTimes(1); // still just the one original bootstrap fetch
});

test('Governance derives its switches from the exact same canonical join_policy Settings\' radio group reads -- invite_only', async () => {
  getTrip.mockResolvedValue({ ...baseTrip, join_policy: 'invite_only' });
  renderApp('/trips/short-1/governance');
  await screen.findByText('governance.title');
  expect(screen.getByLabelText('governance.inviteLinkActive')).not.toBeChecked();
  expect(screen.getByLabelText('governance.requireApproval')).toBeDisabled();
});
