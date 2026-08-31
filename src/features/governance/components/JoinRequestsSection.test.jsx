import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import JoinRequestsSection from './JoinRequestsSection';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));

const guestRequest = { id: 'r1', display_name: 'Ahmed', avatar_key: 'avatar_01', identity_type: 'guest', requested_at: '2026-08-30T10:00:00Z' };
const registeredRequest = { id: 'r2', display_name: 'Sara', avatar_key: 'avatar_02', identity_type: 'registered', requested_at: '2026-08-30T08:00:00Z' };

test('shows a count badge only when there are pending requests', () => {
  const { rerender } = render(<JoinRequestsSection requests={[guestRequest]} onReview={jest.fn()} canReview />);
  expect(screen.getByText('1')).toBeInTheDocument();
  rerender(<JoinRequestsSection requests={[]} onReview={jest.fn()} canReview />);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
});

test('shows an identity badge only for a guest requester, never a registered one', () => {
  render(<JoinRequestsSection requests={[guestRequest, registeredRequest]} onReview={jest.fn()} canReview />);
  expect(screen.getAllByText('identity.guest')).toHaveLength(1);
});

test('approve and reject call onReview with the request and the decision', () => {
  const onReview = jest.fn();
  render(<JoinRequestsSection requests={[guestRequest]} onReview={onReview} canReview />);
  fireEvent.click(screen.getByText('governance.approve'));
  expect(onReview).toHaveBeenCalledWith(guestRequest, 'approve');
  fireEvent.click(screen.getByText('governance.reject'));
  expect(onReview).toHaveBeenCalledWith(guestRequest, 'reject');
});

test('without can_review_join_requests, Approve/Reject never render -- never a role guess', () => {
  render(<JoinRequestsSection requests={[guestRequest]} onReview={jest.fn()} canReview={false} />);
  expect(screen.getByText('Ahmed')).toBeInTheDocument();
  expect(screen.queryByText('governance.approve')).not.toBeInTheDocument();
  expect(screen.queryByText('governance.reject')).not.toBeInTheDocument();
});

test('empty state shows a real message, not a blank bordered box', () => {
  render(<JoinRequestsSection requests={[]} onReview={jest.fn()} canReview />);
  expect(screen.getByText('governance.noRequests')).toBeInTheDocument();
});

test('never shows IP, device fingerprints, or raw guest identifiers as request context', () => {
  render(<JoinRequestsSection requests={[guestRequest]} onReview={jest.fn()} canReview />);
  expect(screen.queryByText(/ip address/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/device/i)).not.toBeInTheDocument();
});
