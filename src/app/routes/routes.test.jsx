import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import publicRoutes from './publicRoutes';
import accountRoutes from './accountRoutes';
import tripRoutes from './tripRoutes';
import { getTrips } from '../../features/trips/api/tripsApi';
import { getCurrencies } from '../../features/currencies/api/currenciesApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../features/trips/api/tripsApi', () => ({ getTrips: jest.fn() }));
jest.mock('../../features/currencies/api/currenciesApi', () => ({ getCurrencies: jest.fn() }));

let mockAuthUser = null;
jest.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, authLoading: false, logout: jest.fn(), saveProfile: jest.fn() }) }));

afterEach(() => { mockAuthUser = null; });
beforeEach(() => {
  getTrips.mockResolvedValue({ results: [] });
  // CreateTripPage mounts CurrencyPicker, which fetches the currency
  // catalog on mount -- without this mock it fires a real, unmocked XHR
  // in jsdom ("Cross origin http://localhost forbidden"), which is flaky
  // under parallel test-suite load even though it doesn't fail the
  // specific assertions in this file.
  getCurrencies.mockResolvedValue({ currencies: [] });
});

const renderAt = (entry, routes) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Suspense fallback={<p>loading</p>}>
      <Routes>{routes}</Routes>
    </Suspense>
  </MemoryRouter>
);

test('"/" loads the public Home route through PublicLayout', async () => {
  renderAt('/', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('home.hero.headline');
});

test('"/features" loads the dedicated features route through PublicLayout', async () => {
  renderAt('/features', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('features.title');
});

test('"/pricing" loads the dedicated pricing route through PublicLayout', async () => {
  renderAt('/pricing', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('pricing.titleLine1');
});

test('anonymous "/create-trip" is redirected through the Auth Gateway', async () => {
  renderAt('/create-trip', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('anonymous "/trips/join" is redirected through the Auth Gateway', async () => {
  renderAt('/trips/join', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('signed-in "/create-trip" loads the dedicated create-trip route directly', async () => {
  mockAuthUser = { id: 'u1' };
  renderAt('/create-trip', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('createTrip.pageTitle');
});

test('signed-in "/trips/join" loads the dedicated join-trip route directly', async () => {
  mockAuthUser = { id: 'u1' };
  renderAt('/trips/join', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('joinTrip.pageTitle');
});

test('legacy "/join-trip" redirects to "/trips/join" and preserves the query string', () => {
  const legacyRoute = publicRoutes.find((route) => route.key === 'join-trip-legacy');
  const ShowSearch = () => <p>search: {useLocation().search}</p>;
  render(
    <MemoryRouter initialEntries={['/join-trip?code=ABC12345']}>
      <Routes>
        {legacyRoute}
        <Route path="/trips/join" element={<ShowSearch />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('search: ?code=ABC12345')).toBeInTheDocument();
});

test('"/auth" loads the Auth Gateway', async () => {
  renderAt('/auth', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('a "continue as guest" arrival at "/create-trip" bypasses the gate even when anonymous', async () => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/create-trip', state: { fromGateway: true } }]}>
      <Suspense fallback={<p>loading</p>}>
        <Routes>{publicRoutes}</Routes>
      </Suspense>
    </MemoryRouter>
  );
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('createTrip.pageTitle');
});

test('legacy "/trip/:code" still redirects into the trip workspace path', () => {
  const legacyRoute = tripRoutes.find((route) => route.key === 'legacy-trip');
  render(
    <MemoryRouter initialEntries={['/trip/abc123']}>
      <Routes>
        {legacyRoute}
        <Route path="/trips/:tripId/overview" element={<p>trip workspace overview</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('trip workspace overview')).toBeInTheDocument();
});

test('anonymous "/dashboard" is redirected through the Auth Gateway', async () => {
  renderAt('/dashboard', [...publicRoutes, ...accountRoutes]);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('signed-in "/dashboard" renders the authenticated trip hub', async () => {
  mockAuthUser = { id: 'u1', display_name: 'Fahad', email: 'fahad@example.com', avatar_type: 'legacy', avatar_key: 'avatar_01' };
  renderAt('/dashboard', [...publicRoutes, ...accountRoutes]);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('dashboard.title');
});

test('authenticated "/auth" with a complete profile and no pending continuation redirects to Dashboard', async () => {
  mockAuthUser = { id: 'u1', display_name: 'Fahad', email: 'fahad@example.com', onboarding_complete: true, avatar_type: 'legacy', avatar_key: 'avatar_01' };
  renderAt('/auth', [...publicRoutes, ...accountRoutes]);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('dashboard.title');
});

test('authenticated "/auth" with an incomplete profile redirects to Complete Profile, not another OTP request', async () => {
  mockAuthUser = { id: 'u1', onboarding_complete: false };
  renderAt('/auth', [...publicRoutes, ...accountRoutes]);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('profile.setup.title');
});

test('a complete-profile user visiting "/profile/setup" directly is bounced to Dashboard, not shown onboarding again', async () => {
  mockAuthUser = { id: 'u1', display_name: 'Fahad', email: 'fahad@example.com', onboarding_complete: true, avatar_type: 'legacy', avatar_key: 'avatar_01' };
  renderAt('/profile/setup', [...publicRoutes, ...accountRoutes]);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('dashboard.title');
});

test('legacy "/profile" still redirects into the account route', () => {
  const legacyRoute = accountRoutes.find((route) => route.key === 'profile-redirect');
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        {legacyRoute}
        <Route path="/account" element={<p>account hub</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('account hub')).toBeInTheDocument();
});

test('legacy "/account/profile" still redirects into the account hub', () => {
  const legacyRoute = accountRoutes.find((route) => route.key === 'account-profile-redirect');
  render(
    <MemoryRouter initialEntries={['/account/profile']}>
      <Routes>
        {legacyRoute}
        <Route path="/account" element={<p>account hub</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('account hub')).toBeInTheDocument();
});
