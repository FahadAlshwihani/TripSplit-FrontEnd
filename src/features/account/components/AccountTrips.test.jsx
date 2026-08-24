import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  id: 'trip-a', title: 'Georgia Winter Trip', currency: 'SAR', start_date: null, end_date: null,
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

const renderTrips = async () => {
  const utils = render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path="/account" element={<AccountTrips />} />
        <Route path="/trips/:id/overview" element={<p>trip overview page</p>} />
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

test('leaving a trip opens a confirmation dialog before calling the leave endpoint', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeMemberTrip] });
  leaveTrip.mockResolvedValue();
  await renderTrips();
  fireEvent.click(await screen.findByText('account.trips.leaveTrip'));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(leaveTrip).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getAllByText('account.trips.leaveTrip').at(-1));
  });
  expect(leaveTrip).toHaveBeenCalledWith('trip-b');
});

test('an owner sees a transfer-before-leave hint instead of a Leave button', async () => {
  getAccountTrips.mockResolvedValue({ count: 1, next: null, previous: null, results: [activeOwnerTrip] });
  await renderTrips();
  expect(await screen.findByText('account.trips.transferBeforeLeave')).toBeInTheDocument();
  expect(screen.queryByText('account.trips.leaveTrip')).not.toBeInTheDocument();
});

test('an empty history shows the empty-state copy', async () => {
  getAccountTrips.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  await renderTrips();
  expect(await screen.findByText('account.trips.empty')).toBeInTheDocument();
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
