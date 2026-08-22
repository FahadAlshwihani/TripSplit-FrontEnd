import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./i18n', () => ({}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', on: jest.fn(), off: jest.fn(), changeLanguage: jest.fn() },
  }),
}));
jest.mock('./features/trips/api/tripsApi', () => ({
  getTrips: jest.fn(() => Promise.resolve({ results: [] })),
  createTrip: jest.fn(), joinTrip: jest.fn(),
}));
jest.mock('./features/auth/api/authApi', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ user: null })), logout: jest.fn(), updateProfile: jest.fn() }));

beforeEach(() => {
  window.history.pushState({}, '', '/');
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('renders the public Home landing with anonymous create/join entry points routed through the Auth Gateway', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('home.hero.headline');
  expect(screen.getByRole('link', { name: 'home.hero.createTrip' })).toHaveAttribute('href', '/auth?next=%2Fcreate-trip');
  expect(screen.getByRole('link', { name: 'home.hero.joinTrip' })).toHaveAttribute('href', '/auth?next=%2Fjoin-trip');
  // Home is a pure landing page now — the live forms live on their own routes.
  expect(screen.queryByText('create.new.trip')).not.toBeInTheDocument();
  expect(screen.queryByText('join.existing.trip')).not.toBeInTheDocument();
});

test('Create Trip CTA routes through the Auth Gateway, and guest continuation reaches the real form', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('link', { name: 'home.hero.createTrip' }));
  fireEvent.click(await screen.findByRole('button', { name: 'auth.guest.action' }));
  expect(await screen.findByText('create.new.trip')).toBeInTheDocument();
});

test('Join Trip CTA routes through the Auth Gateway, and guest continuation reaches the real form', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('link', { name: 'home.hero.joinTrip' }));
  fireEvent.click(await screen.findByRole('button', { name: 'auth.guest.action' }));
  expect(await screen.findByText('join.existing.trip')).toBeInTheDocument();
});

test('defaults to the light theme regardless of any saved preference being absent, and never renders the legacy background on Home', async () => {
  render(<App />);
  await screen.findByRole('heading', { level: 1 });
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  expect(document.querySelector('.area')).not.toBeInTheDocument();
  expect(document.querySelector('.circles')).not.toBeInTheDocument();
});
