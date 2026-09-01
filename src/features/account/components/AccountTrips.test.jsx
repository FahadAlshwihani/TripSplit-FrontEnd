import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import AccountTrips from './AccountTrips';
import { getAccountTrips, leaveTrip } from '../../trips/api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));
jest.mock('../../trips/api/tripsApi', () => ({
  getAccountTrips: jest.fn(),
  leaveTrip: jest.fn(),
  archiveTrip: jest.fn(),
  restoreTrip: jest.fn(),
  closeTrip: jest.fn(),
}));

const activeOwnerTrip = {
  id: 'trip-a', short_code: 'short-a', title: 'Georgia Winter Trip', currency: 'SAR', start_date: null, end_date: null,
  lifecycle_status: 'active', archived_at: null, join_code: 'ABCD1234',
  role: 'owner', membership_active: true, created_by_me: true,
  capabilities: { can_open: true, can_leave: false, can_rejoin: false, can_archive: true, can_restore: false, can_close: true, requires_transfer_before_leave: true },
};

const activeMemberTrip = {
  ...activeOwnerTrip, id: 'trip-b', title: 'Tokyo Autumn', role: 'member', created_by_me: false,
  capabilities: { can_open: true, can_leave: true, can_rejoin: false, can_archive: false, can_restore: false, can_close: false, requires_transfer_before_leave: false },
};

const leftTrip = {
  ...activeOwnerTrip, id: 'trip-c', title: 'Doha Weekend', role: 'member', membership_active: false, created_by_me: false,
  capabilities: { can_open: false, can_leave: false, can_rejoin: true, can_archive: false, can_restore: false, can_close: false, requires_transfer_before_leave: false },
};

const closedTrip = {
  ...activeOwnerTrip, id: 'trip-d', title: 'Barcelona Trip', lifecycle_status: 'closed',
  capabilities: { can_open: true, can_leave: false, can_rejoin: false, can_archive: false, can_restore: false, can_close: false, requires_transfer_before_leave: true },
};

const OverviewSpy = () => { const { id } = useParams(); return <p>trip overview page: <span data-testid="landed-overview-id">{id}</span></p>; };
const MembersSpy = () => { const { id } = useParams(); return <p>trip members page: <span data-testid="landed-members-id">{id}</span></p>; };

const renderTrips = async () => {
  const utils = render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path="/account" element={<AccountTrips />} />
        <Route path="/trips/:id/overview" element={<OverviewSpy />} />
        <Route path="/trips/:id/members" element={<MembersSpy />} />
        <Route path="/trips/join" element={<p>join trip page</p>} />
      </Routes>
    </MemoryRouter>
  );
  await act(async () => {});
  return utils;
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders active owner and member trips with role/state badges', async () => {
  getAccountTrips.mockResolvedValue({ count: 2, next: null, previous: null, results: [activeOwnerTrip, activeMemberTrip] });
  await renderTrips();
  expect(await screen.findByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.getByText('Tokyo Autumn')).toBeInTheDocument();
  expect(screen.getAllByText('account.trips.openTrip')).toHaveLength(2);
});

test('a left membership shows Rejoin instead of Open Trip, with no Leave action', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [leftTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.rejoin')).toBeInTheDocument();
  expect(screen.queryByText('account.trips.openTrip')).not.toBeInTheDocument();
  expect(screen.queryByText('account.trips.leaveTrip')).not.toBeInTheDocument();
});

test('rejoin navigates to the canonical Join Trip flow (never a direct reactivation call)', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [leftTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByText('account.trips.rejoin'));
  expect(await screen.findByText('join trip page')).toBeInTheDocument();
  expect(leaveTrip).not.toHaveBeenCalled();
});

test('a closed trip shows the closed notice and no rejoin action', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [closedTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.closedNotice')).toBeInTheDocument();
  expect(screen.queryByText('account.trips.rejoin')).not.toBeInTheDocument();
});

test('leaving a trip (behind the compact more-actions disclosure) opens a confirmation dialog before calling the leave endpoint', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  leaveTrip.mockResolvedValue();
  await renderTrips();
  // Leave Trip is not a standalone button -- it lives behind the same
  // compact kebab disclosure owner-only lifecycle actions use, so it
  // never carries the same visual weight as the primary Open Trip action.
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  fireEvent.click(screen.getByText('account.trips.leaveTrip'));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(leaveTrip).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getAllByText('account.trips.leaveTrip').at(-1));
  });
  expect(leaveTrip).toHaveBeenCalledWith('trip-b');
});

test('the leave confirmation dialog renders through a portal to document.body, not nested inside the pressable trip card', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  fireEvent.click(screen.getByText('account.trips.leaveTrip'));
  const dialog = screen.getByRole('alertdialog');
  // .acc-trip gets `transform` on hover (the global press system); a
  // transformed ancestor becomes the containing block for a fixed-position
  // descendant, which trapped this dialog inside the card's own small box
  // before it was portaled. Asserting it's not a descendant of .acc-trip
  // at all is the real regression guard, not just "it's visible".
  expect(dialog.closest('.acc-trip')).toBeNull();
  expect(dialog.closest('.acc-card')).toBeNull();
  expect(dialog.closest('body')).toBe(document.body);
});

test('the leave confirmation dialog is present at rest -- opening/closing it never depends on hovering the card', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  await renderTrips();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  fireEvent.click(screen.getByText('account.trips.leaveTrip'));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  fireEvent.click(screen.getByText('common.cancel'));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('Escape cancels the leave confirmation dialog without calling the leave endpoint', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  fireEvent.click(screen.getByText('account.trips.leaveTrip'));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(leaveTrip).not.toHaveBeenCalled();
});

test('a member trip still exposes both Open Trip and (behind more-actions) Leave Trip', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.openTrip')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('account.trips.moreActions'));
  expect(screen.getByText('account.trips.leaveTrip')).toBeInTheDocument();
});

test('an owner trip preserves its owner-only lifecycle actions behind more-actions', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  expect(screen.getByText('account.trips.closeTrip')).toBeInTheDocument();
  expect(screen.getByText('account.trips.archiveTrip')).toBeInTheDocument();
  expect(screen.queryByText('account.trips.leaveTrip')).not.toBeInTheDocument();
});

test('secondary trip actions render as real interactive controls, not naked text links', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  const closeAction = screen.getByText('account.trips.closeTrip').closest('button');
  expect(closeAction).not.toBeNull();
  expect(closeAction).toHaveClass('acc-trip__more-action');
  expect(closeAction.tagName).toBe('BUTTON');
});

test('an owner who cannot leave sees a Manage Ownership control (not just informational text) that hands off to the existing Members flow', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.transferBeforeLeave')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('account.trips.moreActions'));
  const manageAction = screen.getByText('account.trips.manageOwnership').closest('button');
  expect(manageAction).toHaveClass('acc-trip__more-action');
  fireEvent.click(manageAction);
  expect(await screen.findByText(/trip members page/)).toBeInTheDocument();
});

test('Open Trip navigates using the canonical short_code, never the internal UUID', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByText('account.trips.openTrip'));
  expect(await screen.findByTestId('landed-overview-id')).toHaveTextContent('short-a');
});

test('Manage Ownership (behind more-actions) also navigates using the canonical short_code', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  fireEvent.click(await screen.findByLabelText('account.trips.moreActions'));
  fireEvent.click(screen.getByText('account.trips.manageOwnership'));
  expect(await screen.findByTestId('landed-members-id')).toHaveTextContent('short-a');
});

test('badges, title, and date render in the same fixed DOM order regardless of dir (RTL uses only logical CSS, never a different element order)', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [{ ...activeOwnerTrip, start_date: '2026-12-12', end_date: '2026-12-24' }] });
  document.documentElement.dir = 'rtl';
  try {
    await renderTrips();
    const main = (await screen.findByText('Georgia Winter Trip')).closest('.acc-trip__main');
    const children = Array.from(main.children).map((el) => el.className);
    expect(children[0]).toContain('acc-trip__badges');
    expect(children[1]).toContain('acc-trip__title');
    expect(children[2]).toContain('acc-trip__dates');
  } finally {
    document.documentElement.dir = 'ltr';
  }
});

test('an owner sees a transfer-before-leave hint instead of a Leave button', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.transferBeforeLeave')).toBeInTheDocument();
  expect(screen.queryByText('account.trips.leaveTrip')).not.toBeInTheDocument();
});

test('an empty "all" history shows the rich empty state with Create/Join actions', async () => {
  getAccountTrips.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  await renderTrips();
  expect(await screen.findByText('account.trips.emptyAll.title')).toBeInTheDocument();
  expect(screen.getByText('account.trips.emptyAll.description')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/create-trip');
  expect(screen.getByRole('link', { name: 'home.hero.joinTrip' })).toHaveAttribute('href', '/trips/join');
});

test('an empty filtered (non-"all") history shows the plain empty message, no Create/Join actions', async () => {
  getAccountTrips.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  await renderTrips();
  fireEvent.click(screen.getByText('account.trips.filters.closed'));
  expect(await screen.findByText('account.trips.empty')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'home.hero.createTrip' })).not.toBeInTheDocument();
});

test('a load failure shows a retry action', async () => {
  getAccountTrips.mockRejectedValue(new Error('down'));
  await renderTrips();
  expect(await screen.findByText('account.errors.tripsLoadFailed')).toBeInTheDocument();
  fireEvent.click(screen.getByText('account.errors.retry'));
  await waitFor(() => expect(getAccountTrips).toHaveBeenCalledTimes(2));
});

test('switching filters requests the new filter and clears the previous results while loading', async () => {
  getAccountTrips.mockResolvedValueOnce({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  expect(await screen.findByText('Georgia Winter Trip')).toBeInTheDocument();
  let resolveNext;
  getAccountTrips.mockReturnValueOnce(new Promise((resolve) => { resolveNext = resolve; }));
  fireEvent.click(screen.getByText('account.trips.filters.closed'));
  expect(screen.queryByText('Georgia Winter Trip')).not.toBeInTheDocument();
  await act(async () => resolveNext({ count: 0, next: null, previous: null, results: [] }));
  expect(getAccountTrips).toHaveBeenLastCalledWith('closed', expect.anything());
});
