import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TripLayout from './TripLayout';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import { getTrip } from '../features/trips/api/tripsApi';

jest.mock('../features/trips/api/tripsApi', () => ({ getTrip: jest.fn() }));
jest.mock('../components/Layout/MainLayout', () => ({ children }) => <>{children}</>);

const trip = {
  id: 't1', title: 'Outlet Trip', budget: '100', currency: 'SAR', join_code: 'ABC',
  lifecycle_status: 'active', current_member: { id: 'm1', role: 'owner' },
};

const renderTrip = (child = <p>overview outlet</p>) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId" element={<TripLayout />}>
        <Route path="overview" element={child} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => jest.clearAllMocks());

test('renders trip navigation and the nested outlet', async () => {
  getTrip.mockResolvedValue(trip);
  renderTrip();
  expect(await screen.findByText('Outlet Trip')).toBeInTheDocument();
  expect(screen.getByText('overview outlet')).toBeInTheDocument();
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('renders a clear shell error when the core trip request fails', async () => {
  getTrip.mockRejectedValue({ status: 403, message: 'Forbidden' });
  renderTrip();
  expect(await screen.findByRole('alert')).toHaveTextContent('You do not have access to this trip.');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('shell retry starts a fresh core trip request', async () => {
  getTrip.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(trip);
  renderTrip();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Outlet Trip')).toBeInTheDocument();
  expect(getTrip).toHaveBeenCalledTimes(2);
});

test('a secondary route failure leaves the trip shell and navigation visible', async () => {
  getTrip.mockResolvedValue(trip);
  const FailedSection = () => {
    const resource = useRouteResource(() => Promise.reject(new Error('Activity unavailable')), ['activity']);
    return resource.error ? <ErrorState message={resource.error.message} onRetry={resource.retry} /> : null;
  };
  renderTrip(<FailedSection />);
  expect(await screen.findByText('Activity unavailable')).toBeInTheDocument();
  expect(screen.getByText('Outlet Trip')).toBeInTheDocument();
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
