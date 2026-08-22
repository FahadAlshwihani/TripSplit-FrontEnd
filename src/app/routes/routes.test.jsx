import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import publicRoutes from './publicRoutes';
import accountRoutes from './accountRoutes';
import tripRoutes from './tripRoutes';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

let mockAuthUser = null;
jest.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, authLoading: false, logout: jest.fn() }) }));

afterEach(() => { mockAuthUser = null; });

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

test('anonymous "/join-trip" is redirected through the Auth Gateway', async () => {
  renderAt('/join-trip', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('auth.email.heading');
});

test('signed-in "/create-trip" loads the dedicated create-trip route directly', async () => {
  mockAuthUser = { id: 'u1' };
  renderAt('/create-trip', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('home.hero.createTrip');
});

test('signed-in "/join-trip" loads the dedicated join-trip route directly', async () => {
  mockAuthUser = { id: 'u1' };
  renderAt('/join-trip', publicRoutes);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('home.hero.joinTrip');
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
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('home.hero.createTrip');
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

test('legacy "/profile" still redirects into the account route', () => {
  const legacyRoute = accountRoutes.find((route) => route.key === 'profile-redirect');
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        {legacyRoute}
        <Route path="/account/profile" element={<p>account profile</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('account profile')).toBeInTheDocument();
});
