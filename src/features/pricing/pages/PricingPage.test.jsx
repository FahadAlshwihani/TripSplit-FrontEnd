import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PricingPage from './PricingPage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import { AuthProvider } from '../../../auth/AuthContext';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
// PublicNav (via PublicLayout) now reads auth state to decide Sign In vs
// Dashboard — mocked so the anonymous state resolves instantly instead of
// via a real, unmocked network call.
jest.mock('../../auth/api/authApi', () => ({ getCurrentUser: () => Promise.reject(new Error('anonymous')), logout: jest.fn(), updateProfile: jest.fn() }));

const renderPricing = () => render(<MemoryRouter><ThemeProvider><AuthProvider><PricingPage /></AuthProvider></ThemeProvider></MemoryRouter>);

test('renders the pricing headline as the page h1', () => {
  renderPricing();
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1).toHaveTextContent('pricing.titleLine1');
  expect(h1).toHaveTextContent('pricing.titleLine2');
});

test('renders the $0 forever-free price', () => {
  renderPricing();
  expect(screen.getByText('0')).toBeInTheDocument();
  expect(screen.getByText('$')).toBeInTheDocument();
  expect(screen.getByText('pricing.freeBadge')).toBeInTheDocument();
});

test('renders all five approved feature ledger items', () => {
  renderPricing();
  expect(screen.getByText('pricing.features.unlimitedTrips')).toBeInTheDocument();
  expect(screen.getByText('pricing.features.sharedExpenses')).toBeInTheDocument();
  expect(screen.getByText('pricing.features.tripFund')).toBeInTheDocument();
  expect(screen.getByText('pricing.features.exportableLedgers')).toBeInTheDocument();
  expect(screen.getByText('pricing.features.multiCurrency')).toBeInTheDocument();
});

test('renders the bottom assurance row', () => {
  renderPricing();
  expect(screen.getByText('pricing.noSubscription')).toBeInTheDocument();
  expect(screen.getByText('pricing.noPaidTier')).toBeInTheDocument();
  expect(screen.getByText('pricing.noCreditCard')).toBeInTheDocument();
});

test('the CTA routes to the dedicated /create-trip page', () => {
  render(
    <MemoryRouter initialEntries={['/pricing']}>
      <Routes>
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/create-trip" element={<p>create-trip-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('link', { name: /pricing.createFree/ }));
  expect(screen.getByText('create-trip-page')).toBeInTheDocument();
});

test('uses the shared public layout: nav brand, footer and utility controls all present', async () => {
  renderPricing();
  expect(document.querySelector('.public-nav')).toBeInTheDocument();
  expect(document.querySelector('.public-footer')).toBeInTheDocument();
  expect(screen.getAllByText('home.nav.brand').length).toBeGreaterThanOrEqual(2);
  expect(await screen.findByRole('link', { name: 'home.nav.signIn' })).toHaveAttribute('href', '/auth');
});

test('theme and language controls remain present on the pricing page', () => {
  renderPricing();
  expect(screen.getByRole('button', { name: 'language.switchToArabic' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'theme.switchToDark' })).toBeInTheDocument();
});

test('does not render a second/competing navbar', () => {
  renderPricing();
  expect(document.querySelectorAll('.public-nav').length).toBe(1);
  expect(document.querySelectorAll('nav').length).toBe(1);
});
