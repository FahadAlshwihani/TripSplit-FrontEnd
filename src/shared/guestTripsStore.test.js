import { listGuestTrips, recordGuestTrip, removeGuestTrip, clearGuestTrips } from './guestTripsStore';

beforeEach(() => localStorage.clear());

test('returns an empty list when nothing has been recorded', () => {
  expect(listGuestTrips()).toEqual([]);
});

test('records a guest trip and lists it back', () => {
  recordGuestTrip({ tripId: 'trip-1', title: 'Georgia Winter Trip', relationship: 'owner' });
  const list = listGuestTrips();
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ trip_id: 'trip-1', title: 'Georgia Winter Trip', relationship: 'owner' });
});

test('recording the same trip again replaces the old entry instead of duplicating it', () => {
  recordGuestTrip({ tripId: 'trip-1', title: 'Old Title', relationship: 'member' });
  recordGuestTrip({ tripId: 'trip-1', title: 'New Title', relationship: 'member' });
  const list = listGuestTrips();
  expect(list).toHaveLength(1);
  expect(list[0].title).toBe('New Title');
});

test('removeGuestTrip drops only the specified trip', () => {
  recordGuestTrip({ tripId: 'trip-1' });
  recordGuestTrip({ tripId: 'trip-2' });
  removeGuestTrip('trip-1');
  const list = listGuestTrips();
  expect(list).toHaveLength(1);
  expect(list[0].trip_id).toBe('trip-2');
});

test('clearGuestTrips empties the index', () => {
  recordGuestTrip({ tripId: 'trip-1' });
  clearGuestTrips();
  expect(listGuestTrips()).toEqual([]);
});
