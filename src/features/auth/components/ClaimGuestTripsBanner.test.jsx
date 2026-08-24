import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ClaimGuestTripsBanner from './ClaimGuestTripsBanner';
import { claimGuestMemberships } from '../api/authApi';
import { saveGuestToken, getGuestToken } from '../../../api/credentials';
import { recordGuestTrip, listGuestTrips } from '../../../shared/guestTripsStore';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('../api/authApi', () => ({ claimGuestMemberships: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('renders nothing when there are no locally-held guest trips', () => {
  const { container } = render(<ClaimGuestTripsBanner />);
  expect(container).toBeEmptyDOMElement();
});

test('renders nothing for a recorded trip whose local credential is missing', () => {
  recordGuestTrip({ tripId: 'trip-1', title: 'Ghost Trip' });
  const { container } = render(<ClaimGuestTripsBanner />);
  expect(container).toBeEmptyDOMElement();
});

test('offers to claim an eligible locally-held guest trip and cleans up local storage on success', async () => {
  saveGuestToken('trip-1', 'secret-token');
  recordGuestTrip({ tripId: 'trip-1', title: 'Georgia Winter Trip', relationship: 'member' });
  claimGuestMemberships.mockResolvedValue({ results: [{ trip_public_id: 'trip-1', outcome: 'claimed' }] });

  render(<ClaimGuestTripsBanner />);
  expect(screen.getByText('claim.title')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByText('claim.action'));
  });

  expect(claimGuestMemberships).toHaveBeenCalledWith([{ trip_public_id: 'trip-1', guest_token: 'secret-token' }]);
  expect(getGuestToken('trip-1')).toBeNull();
  expect(listGuestTrips()).toEqual([]);
});

test('dismissing the banner hides it without claiming anything', () => {
  saveGuestToken('trip-1', 'secret-token');
  recordGuestTrip({ tripId: 'trip-1' });
  render(<ClaimGuestTripsBanner />);
  fireEvent.click(screen.getByText('common.cancel'));
  expect(screen.queryByText('claim.title')).not.toBeInTheDocument();
  expect(claimGuestMemberships).not.toHaveBeenCalled();
});

test('a failed claim request leaves local credentials untouched for a retry', async () => {
  saveGuestToken('trip-1', 'secret-token');
  recordGuestTrip({ tripId: 'trip-1' });
  claimGuestMemberships.mockRejectedValue(new Error('network down'));

  render(<ClaimGuestTripsBanner />);
  await act(async () => {
    fireEvent.click(screen.getByText('claim.action'));
  });

  expect(getGuestToken('trip-1')).toBe('secret-token');
  expect(listGuestTrips()).toHaveLength(1);
  expect(screen.getByRole('alert')).toHaveTextContent('claim.errors.failed');
});
