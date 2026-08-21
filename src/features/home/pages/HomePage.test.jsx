import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage, changeLanguage: jest.fn() } }) }));

afterEach(() => { mockLanguage = 'en'; });

const renderHome = () => render(<MemoryRouter><HomePage /></MemoryRouter>);

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

test('Create Trip CTA routes to the dedicated /create-trip page', () => {
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

test('Join Trip CTA routes to the dedicated /join-trip page', () => {
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
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/create-trip');
});
