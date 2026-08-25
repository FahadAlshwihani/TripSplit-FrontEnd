import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TripLayout from './TripLayout';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import { getTrip } from '../features/trips/api/tripsApi';

jest.mock('../features/trips/api/tripsApi', () => ({ getTrip: jest.fn() }));

// DashboardShell's mobile header docks the existing global AccountMenu
// (see MobileDashboardHeader) -- it needs an AuthContext/ThemeProvider
// ancestor to render at all, same as AccountMenu's own test file.
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: { display_name: 'Fahad', email: 'fahad@example.com' }, isAuthenticated: true, authLoading: false, saveProfile: jest.fn(), logout: jest.fn() }) }));
jest.mock('../components/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', setTheme: jest.fn() }) }));

const trip = {
  id: 't1', title: 'Outlet Trip', budget: '100', currency: 'SAR', join_code: 'ABC',
  lifecycle_status: 'active', current_member: { id: 'm1', role: 'owner', identity_type: 'registered' },
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

test('renders the dashboard shell navigation and the nested outlet', async () => {
  getTrip.mockResolvedValue(trip);
  renderTrip();
  // Trip title renders once in the desktop sidebar and once in the
  // mobile header -- both always mounted (see note below).
  expect((await screen.findAllByText('Outlet Trip')).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('overview outlet')).toBeInTheDocument();
  // Sidebar (desktop) and bottom nav (mobile) are both always mounted --
  // real browsers show only one at a given viewport via CSS, but jsdom
  // doesn't evaluate media queries, so both exist in this render.
  expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(1);
});

test('renders a clear shell error when the core trip request fails', async () => {
  getTrip.mockRejectedValue({ status: 403, message: 'Forbidden' });
  renderTrip();
  expect(await screen.findByRole('alert')).toHaveTextContent('trip.errors.accessDenied');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('shell retry starts a fresh core trip request', async () => {
  getTrip.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(trip);
  renderTrip();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect((await screen.findAllByText('Outlet Trip')).length).toBeGreaterThanOrEqual(1);
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
  expect(screen.getAllByText('Outlet Trip').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(1);
});
