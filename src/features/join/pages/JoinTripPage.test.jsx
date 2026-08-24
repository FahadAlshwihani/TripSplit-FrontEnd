import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JoinTripPage from './JoinTripPage';
import { joinTrip } from '../../trips/api/tripsApi';
import { getJoinCapability } from '../api/joinApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
let mockAuthUser = null;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, authLoading: false, logout: jest.fn() }) }));
jest.mock('../../trips/api/tripsApi', () => ({ joinTrip: jest.fn() }));
jest.mock('../api/joinApi', () => ({ getJoinCapability: jest.fn(), requestInvitationOtp: jest.fn(), verifyInvitationOtp: jest.fn() }));

const TRIP_PREVIEW = { title: 'Georgia Winter Trip', start_date: null, end_date: null, currency: 'SAR', member_count: 5, join_policy: 'open', password_required: false };

const renderPage = async (entry = '/trips/join') => {
  const utils = render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/trips/join" element={<JoinTripPage />} />
        <Route path="/trips/:id/overview" element={<p>trip workspace overview</p>} />
        <Route path="/join-request/:id" element={<p>join request page</p>} />
        <Route path="/invite/:token" element={<p>invitation page</p>} />
        <Route path="/dashboard" element={<p>dashboard page</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>
  );
  await act(async () => {});
  return utils;
};

const lookup = async (code = 'ABCD1234') => {
  fireEvent.change(screen.getByLabelText('joinTrip.codeOrLink'), { target: { value: code } });
  await act(async () => {
    fireEvent.keyDown(screen.getByLabelText('joinTrip.codeOrLink'), { key: 'Enter' });
  });
};

beforeEach(() => {
  mockAuthUser = null;
});

test('renders the code/link field and no preview before any lookup', async () => {
  await renderPage();
  expect(screen.getByText('joinTrip.pageTitle')).toBeInTheDocument();
  expect(screen.getByLabelText('joinTrip.codeOrLink')).toBeInTheDocument();
  expect(screen.queryByText('joinTrip.tripFound')).not.toBeInTheDocument();
});

test('an open trip shows the preview and a Join Trip action', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'ready_open' });
  await renderPage();
  await lookup();
  expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.getByText('joinTrip.joinTripButton')).toBeInTheDocument();
  expect(screen.queryByText('joinTrip.requestToJoin')).not.toBeInTheDocument();
});

test('an approval-required trip shows a Request to Join action instead', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: { ...TRIP_PREVIEW, join_policy: 'approval_required' }, action: 'ready_request' });
  await renderPage();
  await lookup();
  expect(screen.getByText('joinTrip.requestToJoin')).toBeInTheDocument();
  expect(screen.queryByText('joinTrip.joinTripButton')).not.toBeInTheDocument();
});

test('a password-protected trip renders the room password field, and omitting it does not block rendering the form', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: { ...TRIP_PREVIEW, password_required: true }, action: 'ready_open' });
  await renderPage();
  await lookup();
  expect(screen.getByLabelText('joinTrip.roomPassword')).toBeInTheDocument();
});

test('already being a member shows an Open Trip action with no join form', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'already_member', trip_id: 'trip-123' });
  await renderPage();
  await lookup();
  expect(screen.getByText('joinTrip.states.alreadyMember')).toBeInTheDocument();
  fireEvent.click(screen.getByText('joinTrip.openTrip'));
  expect(await screen.findByText('trip workspace overview')).toBeInTheDocument();
});

test('an invite-only trip reached by code shows Invitation Required with no submit action', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: { ...TRIP_PREVIEW, join_policy: 'invite_only' }, action: 'invite_required' });
  await renderPage();
  await lookup();
  expect(screen.getByText('joinTrip.states.inviteRequired')).toBeInTheDocument();
  expect(screen.queryByText('joinTrip.joinTripButton')).not.toBeInTheDocument();
  expect(screen.queryByText('joinTrip.requestToJoin')).not.toBeInTheDocument();
});

test('a banned identity sees the banned message', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'banned', banned_until: null });
  await renderPage();
  await lookup();
  expect(screen.getByText('joinTrip.states.banned')).toBeInTheDocument();
});

test('an already-requested identity can deep-link to the pending join-request page', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: { ...TRIP_PREVIEW, join_policy: 'approval_required' }, action: 'already_requested', request_id: 'req-1' });
  await renderPage();
  await lookup();
  fireEvent.click(screen.getByText('joinRequest.sent'));
  expect(await screen.findByText('join request page')).toBeInTheDocument();
});

test('submitting an open trip navigates directly into the trip overview', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'ready_open' });
  joinTrip.mockResolvedValue({ trip: { id: 'trip-1' } });
  await renderPage();
  await lookup();
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Alex' } });
  fireEvent.click(screen.getByText('joinTrip.joinTripButton'));
  await waitFor(() => expect(joinTrip).toHaveBeenCalledWith(expect.objectContaining({ join_code: 'ABCD1234', guest_name: 'Alex' })));
  expect(await screen.findByText('trip workspace overview')).toBeInTheDocument();
});

test('a pasted invitation token immediately hands off to the dedicated invitation flow', async () => {
  await renderPage();
  const token = 'a'.repeat(40);
  fireEvent.change(screen.getByLabelText('joinTrip.codeOrLink'), { target: { value: token } });
  fireEvent.keyDown(screen.getByLabelText('joinTrip.codeOrLink'), { key: 'Enter' });
  expect(await screen.findByText('invitation page')).toBeInTheDocument();
  expect(getJoinCapability).not.toHaveBeenCalled();
});

test('a ?code= query param pre-fills and auto-triggers the lookup (Flow B)', async () => {
  getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'ready_open' });
  await renderPage('/trips/join?code=PREFILL1');
  expect(await screen.findByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(getJoinCapability).toHaveBeenCalledWith({ mode: 'code', value: 'PREFILL1' }, expect.anything());
});

test('cancel navigates anonymous visitors to Home', async () => {
  await renderPage();
  fireEvent.click(screen.getByLabelText('common.cancel'));
  expect(screen.getByText('home page')).toBeInTheDocument();
});

test('cancel navigates authenticated visitors to Dashboard', async () => {
  mockAuthUser = { id: 'u1', display_name: 'Fahad', avatar_type: 'legacy', avatar_key: 'avatar_01' };
  await renderPage();
  fireEvent.click(screen.getByLabelText('common.cancel'));
  expect(screen.getByText('dashboard page')).toBeInTheDocument();
});

describe('explicit Find Trip action', () => {
  test('the Find Trip button is disabled with empty input and enabled once text is entered', async () => {
    await renderPage();
    expect(screen.getByText('joinTrip.findTrip').closest('button')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('joinTrip.codeOrLink'), { target: { value: 'ABCD1234' } });
    expect(screen.getByText('joinTrip.findTrip').closest('button')).not.toBeDisabled();
  });

  test('clicking Find Trip triggers the lookup without needing Enter or blur', async () => {
    getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'ready_open' });
    await renderPage();
    fireEvent.change(screen.getByLabelText('joinTrip.codeOrLink'), { target: { value: 'ABCD1234' } });
    await act(async () => {
      fireEvent.click(screen.getByText('joinTrip.findTrip'));
    });
    expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
    expect(getJoinCapability).toHaveBeenCalledWith({ mode: 'code', value: 'ABCD1234' }, expect.anything());
  });

  test('leaving the field (blur) alone does not trigger a lookup', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('joinTrip.codeOrLink'), { target: { value: 'ABCD1234' } });
    fireEvent.blur(screen.getByLabelText('joinTrip.codeOrLink'));
    await act(async () => {});
    expect(getJoinCapability).not.toHaveBeenCalled();
  });

  test('pasting a complete code auto-starts the lookup while the button remains the primary action', async () => {
    getJoinCapability.mockResolvedValue({ mode: 'code', trip: TRIP_PREVIEW, action: 'ready_open' });
    await renderPage();
    await act(async () => {
      fireEvent.paste(screen.getByLabelText('joinTrip.codeOrLink'), { clipboardData: { getData: () => 'ABCD1234' } });
    });
    expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
    expect(screen.getByText('joinTrip.findTrip').closest('button')).toBeInTheDocument();
  });
});

describe('differentiated lookup errors', () => {
  test('a trip-not-found response shows the not-found message', async () => {
    getJoinCapability.mockRejectedValue({ status: 400, code: 'trip_not_found', message: 'No trip matches that code.' });
    await renderPage();
    await lookup();
    expect(screen.getByRole('alert')).toHaveTextContent('joinTrip.errors.notFound');
  });

  test('a rate-limited response shows the rate-limit message, distinct from not-found', async () => {
    getJoinCapability.mockRejectedValue({ status: 429, code: 'join_lookup_rate_limited', message: 'Too many lookups.' });
    await renderPage();
    await lookup();
    expect(screen.getByRole('alert')).toHaveTextContent('joinTrip.errors.rateLimited');
  });

  test('a network failure shows the network-error message, distinct from not-found', async () => {
    getJoinCapability.mockRejectedValue({ status: 0, code: 'network_error', message: 'Unable to reach the server.' });
    await renderPage();
    await lookup();
    expect(screen.getByRole('alert')).toHaveTextContent('joinTrip.errors.network');
  });
});
