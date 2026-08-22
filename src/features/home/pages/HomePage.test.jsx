import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import { ThemeProvider } from '../../../components/ThemeProvider';

let mockLanguage = 'en';
const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage, changeLanguage: mockChangeLanguage } }) }));

// Hero/ProductPreview CTAs read useAuth() to decide whether Create/Join Trip
// route straight to the page (signed in) or through the Auth Gateway first
// (anonymous). Defaults to anonymous, matching the guest-first product
// default; individual tests override mockAuthUser to cover the signed-in path.
let mockAuthUser = null;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, authLoading: false, logout: jest.fn() }) }));

afterEach(() => { mockLanguage = 'en'; mockAuthUser = null; mockChangeLanguage.mockClear(); window.localStorage.clear(); document.documentElement.removeAttribute('data-theme'); });

const renderHome = () => render(<MemoryRouter><ThemeProvider><HomePage /></ThemeProvider></MemoryRouter>);

test('renders the approved hero headline', () => {
  renderHome();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.hero.headline');
});

test('renders the desktop hero, nav and footer content', () => {
  renderHome();
  expect(screen.getByText('home.hero.descriptionDesktop')).toBeInTheDocument();
  expect(screen.getAllByText('home.nav.brand').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('home.nav.features')).toBeInTheDocument();
  expect(screen.getByText('home.footer.copyright')).toBeInTheDocument();
});

test('does not embed the Create Trip or Join Trip forms', () => {
  renderHome();
  expect(screen.queryByText('create.new.trip')).not.toBeInTheDocument();
  expect(screen.queryByText('join.existing.trip')).not.toBeInTheDocument();
  expect(screen.queryByText('trip.history')).not.toBeInTheDocument();
  expect(document.querySelector('.pc-input')).not.toBeInTheDocument();
  expect(document.getElementById('create-trip')).not.toBeInTheDocument();
  expect(document.getElementById('get-started')).not.toBeInTheDocument();
});

test('anonymous Create Trip CTA routes through the Auth Gateway first', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<p>auth-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/auth?next=%2Fcreate-trip');
  fireEvent.click(screen.getByRole('link', { name: 'home.hero.createTrip' }));
  expect(screen.getByText('auth-page')).toBeInTheDocument();
});

test('anonymous Join Trip CTA routes through the Auth Gateway first', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<p>auth-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: 'home.hero.joinTrip' })).toHaveAttribute('href', '/auth?next=%2Fjoin-trip');
  fireEvent.click(screen.getByRole('link', { name: 'home.hero.joinTrip' }));
  expect(screen.getByText('auth-page')).toBeInTheDocument();
});

test('signed-in Create Trip CTA routes straight to the dedicated page', () => {
  mockAuthUser = { id: 'u1' };
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-trip" element={<p>create-trip-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('link', { name: 'home.hero.createTrip' }));
  expect(screen.getByText('create-trip-page')).toBeInTheDocument();
});

test('signed-in Join Trip CTA routes straight to the dedicated page', () => {
  mockAuthUser = { id: 'u1' };
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join-trip" element={<p>join-trip-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('link', { name: 'home.hero.joinTrip' }));
  expect(screen.getByText('join-trip-page')).toBeInTheDocument();
});

test('Sign In uses the existing auth route', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<p>auth-page</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('link', { name: 'home.nav.signIn' }));
  expect(await screen.findByText('auth-page')).toBeInTheDocument();
});

test('renders the static product preview content', () => {
  renderHome();
  expect(screen.getByText('home.preview.eyebrow')).toBeInTheDocument();
  expect(screen.getByText('home.preview.tripName')).toBeInTheDocument();
  expect(screen.getByText('home.preview.expense1Title')).toBeInTheDocument();
  expect(screen.getByText('home.preview.mobileTripName')).toBeInTheDocument();
});

test('renders the reference-matching preview eyebrow icon and expenses filter icon', () => {
  renderHome();
  expect(document.querySelector('.preview__eyebrow-icon')).toBeInTheDocument();
  expect(document.querySelector('.preview-list__filter-icon')).toBeInTheDocument();
});

test('does not render deprecated marketing chrome from the old public shell', () => {
  renderHome();
  expect(screen.queryByText('footer.tagline')).not.toBeInTheDocument();
  expect(screen.queryByText('footer.connect')).not.toBeInTheDocument();
  expect(document.querySelector('.glowing-title')).not.toBeInTheDocument();
  expect(document.querySelector('.header__burger')).not.toBeInTheDocument();
});

test('renders correctly when the active language is Arabic', () => {
  mockLanguage = 'ar';
  renderHome();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.hero.headline');
  expect(screen.getByText('home.preview.tripName')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/auth?next=%2Fcreate-trip');
});

test('does not render the legacy animated background anywhere on the page', () => {
  renderHome();
  expect(document.querySelector('.area')).not.toBeInTheDocument();
  expect(document.querySelector('.circles')).not.toBeInTheDocument();
});

test('public nav exposes language and theme controls and defaults to light', () => {
  renderHome();
  expect(screen.getByRole('button', { name: 'language.switchToEnglish' })).toHaveTextContent('EN');
  expect(screen.getByRole('button', { name: 'language.switchToArabic' })).toHaveTextContent('AR');
  expect(screen.getByRole('button', { name: 'theme.switchToDark' })).toBeInTheDocument();
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});

test('the language control switches i18next language', () => {
  renderHome();
  fireEvent.click(screen.getByRole('button', { name: 'language.switchToArabic' }));
  expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
});

test('the theme control toggles data-theme and persists the choice', () => {
  renderHome();
  fireEvent.click(screen.getByRole('button', { name: 'theme.switchToDark' }));
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(window.localStorage.getItem('tripsplit:theme')).toBe('dark');
  fireEvent.click(screen.getByRole('button', { name: 'theme.switchToLight' }));
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});
