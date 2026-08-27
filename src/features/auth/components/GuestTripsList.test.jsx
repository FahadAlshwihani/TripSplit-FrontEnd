import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GuestTripsList from './GuestTripsList';
import { getGuestSession } from '../api/guestSessionApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('../api/guestSessionApi', () => ({ getGuestSession: jest.fn() }));

const renderList = () => render(<MemoryRouter><GuestTripsList /></MemoryRouter>);

test('renders nothing while loading, and nothing once resolved with no saved trips', async () => {
  let resolvePromise;
  getGuestSession.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));
  const { container } = renderList();
  expect(container).toBeEmptyDOMElement();
  resolvePromise({ guest: null, trips: [] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(container).toBeEmptyDOMElement();
});

test('renders an active trip as an actionable row', async () => {
  getGuestSession.mockResolvedValue({ guest: { display_name: 'Fahad' }, trips: [{ trip_public_id: 't1', title: 'Summer', role: 'member', state: 'active', join_code: 'AB12CD34' }] });
  renderList();
  expect(await screen.findByText('Summer')).toBeInTheDocument();
  expect(screen.getByText('guest.trips.state.active')).toBeInTheDocument();
});

test('renders a banned trip as a non-actionable notice, not a button', async () => {
  getGuestSession.mockResolvedValue({ guest: { display_name: 'Fahad' }, trips: [{ trip_public_id: 't2', title: 'Winter', role: 'member', state: 'banned', join_code: 'ZZ99YY88' }] });
  renderList();
  await screen.findByText('Winter');
  expect(screen.queryByRole('button', { name: 'guest.trips.state.banned' })).not.toBeInTheDocument();
  expect(screen.getByText('guest.trips.state.banned')).toBeInTheDocument();
});

test('a failed fetch does not throw or leave a broken UI', async () => {
  getGuestSession.mockRejectedValue(new Error('network'));
  const { container } = renderList();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(container).toBeEmptyDOMElement();
});
