import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import TripLayout from './TripLayout';
import ErrorState from '../shared/components/ErrorState';
import useRouteResource from '../shared/hooks/useRouteResource';
import { getTrip } from '../features/trips/api/tripsApi';
import { getGuestToken, saveGuestToken } from '../api/credentials';

jest.mock('../features/trips/api/tripsApi', () => ({ getTrip: jest.fn() }));

// DashboardShell's mobile header docks the existing global AccountMenu
// (see MobileDashboardHeader) -- it needs an AuthContext/ThemeProvider
// ancestor to render at all, same as AccountMenu's own test file.
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: { display_name: 'Fahad', email: 'fahad@example.com' }, isAuthenticated: true, authLoading: false, saveProfile: jest.fn(), logout: jest.fn() }) }));
jest.mock('../components/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', setTheme: jest.fn() }) }));

// short_code deliberately equals the URL param used by renderTrip()'s
// default route ('t1') -- already canonical, so the existing tests
// below (written before short_code existed) see no redirect at all,
// exactly as before. Tests specifically covering the redirect/mirroring
// behavior below use their own fixture where id/short_code/URL differ.
const trip = {
  id: 't1', short_code: 't1', title: 'Outlet Trip', budget: '100', currency: 'SAR', join_code: 'ABC',
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

// --- Stage 2: short_code route bootstrap ---------------------------------

const shortCodeTrip = {
  id: 'uuid-1234-real', short_code: 'shortcode123', title: 'Short Trip', budget: '100', currency: 'SAR', join_code: 'ABC',
  lifecycle_status: 'active', current_member: { id: 'm1', role: 'owner', identity_type: 'registered' },
};

const LocationSpy = () => {
  const location = require('react-router-dom').useLocation();
  return <p data-testid="location-spy">{location.pathname}{location.search}</p>;
};

const OutletTripIdSpy = () => {
  const { tripId } = useOutletContext();
  return <p data-testid="outlet-trip-id">{tripId}</p>;
};

const renderTripAt = (initialPath, child) => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/trips/:tripId" element={<><TripLayout /><LocationSpy /></>}>
        <Route path="overview" element={child} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => localStorage.clear());

test('a legacy UUID URL replaces the address bar with the canonical short_code URL, preserving the sub-path', async () => {
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/uuid-1234-real/overview');
  await screen.findAllByText('Short Trip');
  await waitFor(() => expect(screen.getByTestId('location-spy')).toHaveTextContent('/trips/shortcode123/overview'));
});

test('a URL already using the canonical short_code never triggers a redirect', async () => {
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/shortcode123/overview');
  await screen.findAllByText('Short Trip');
  expect(screen.getByTestId('location-spy')).toHaveTextContent('/trips/shortcode123/overview');
  expect(getTrip).toHaveBeenCalledTimes(1); // no redirect-triggered refetch
});

test('the redirect preserves the query string', async () => {
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/uuid-1234-real/overview?round=5');
  await screen.findAllByText('Short Trip');
  await waitFor(() => expect(screen.getByTestId('location-spy')).toHaveTextContent('/trips/shortcode123/overview?round=5'));
});

test('every trip-scoped page still receives the UUID id (not short_code) via Outlet context, unaffected by which URL form loaded it', async () => {
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/shortcode123/overview', <OutletTripIdSpy />);
  expect(await screen.findByTestId('outlet-trip-id')).toHaveTextContent('uuid-1234-real');
});

test('DashboardShell navigation links use the short_code, not the UUID, so in-app navigation stays on canonical URLs', async () => {
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/shortcode123/overview');
  await screen.findAllByText('Short Trip');
  const expensesLink = document.querySelector('a[href="/trips/shortcode123/expenses"]');
  expect(expensesLink).toBeInTheDocument();
  expect(document.querySelector('a[href="/trips/uuid-1234-real/expenses"]')).toBeNull();
});

test('a guest token saved under the UUID is mirrored to the short_code once the trip loads, so a later visit via short_code still finds it', async () => {
  saveGuestToken('uuid-1234-real', 'guest-token-abc');
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/uuid-1234-real/overview');
  await screen.findAllByText('Short Trip');
  expect(getGuestToken('shortcode123')).toBe('guest-token-abc');
  expect(getGuestToken('uuid-1234-real')).toBe('guest-token-abc');
});

test('a guest token saved under the short_code is mirrored to the UUID (used by every page-level API call)', async () => {
  saveGuestToken('shortcode123', 'guest-token-xyz');
  getTrip.mockResolvedValue(shortCodeTrip);
  renderTripAt('/trips/shortcode123/overview');
  await screen.findAllByText('Short Trip');
  expect(getGuestToken('uuid-1234-real')).toBe('guest-token-xyz');
});

test('the canonicalizing redirect never blanks the page with a full-page loader -- trip data stays visible through the background refetch', async () => {
  let resolveSecond;
  getTrip
    .mockResolvedValueOnce(shortCodeTrip)
    .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
  renderTripAt('/trips/uuid-1234-real/overview');
  await screen.findAllByText('Short Trip');
  await waitFor(() => expect(screen.getByTestId('location-spy')).toHaveTextContent('/trips/shortcode123/overview'));
  // The redirect-triggered refetch is now in flight (still unresolved) --
  // the previously-loaded trip must still be fully rendered, not a
  // full-page NeoLoading blank.
  expect(screen.getAllByText('Short Trip').length).toBeGreaterThanOrEqual(1);
  expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
  resolveSecond(shortCodeTrip);
  await waitFor(() => expect(getTrip).toHaveBeenCalledTimes(2));
});
