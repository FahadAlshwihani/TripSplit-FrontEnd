import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountPage from './AccountPage';
import { getAccountTrips } from '../../trips/api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../trips/api/tripsApi', () => ({
  getAccountTrips: jest.fn(),
  leaveTrip: jest.fn(),
  archiveTrip: jest.fn(),
  restoreTrip: jest.fn(),
  closeTrip: jest.fn(),
}));
jest.mock('../../../shared/components/useCurrencyCatalog', () => ({
  __esModule: true,
  default: () => ({ currencies: [{ code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', countries: [{ name: 'Saudi Arabia', flag: '🇸🇦' }] }], error: null }),
}));

const baseUser = {
  display_name: 'Fahad', email: 'fahad@example.com', avatar_type: 'initials', avatar_color: 'indigo',
  preferred_language: 'en', preferred_theme: 'light', preferred_currency: 'SAR',
  notification_preferences: { trip_invitations: true, join_request_updates: true, funding_round_requests: true, contribution_updates: true, settlement_updates: true, trip_lifecycle_updates: true },
};

let mockUser = baseUser;
const mockSaveProfile = jest.fn();
const mockLogout = jest.fn();
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockUser, authLoading: false, saveProfile: mockSaveProfile, logout: mockLogout, refreshUser: jest.fn() }) }));

const renderPage = async (entry = { pathname: '/account' }) => {
  const utils = render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/trips/join" element={<p>join trip page</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>
  );
  await act(async () => {});
  return utils;
};

beforeEach(() => {
  mockUser = baseUser;
  mockSaveProfile.mockReset();
  mockLogout.mockReset().mockResolvedValue();
  getAccountTrips.mockReset().mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
});

test('renders the canonical identity, preferences, and notifications from the server profile', async () => {
  await renderPage();
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  expect(screen.getByLabelText('account.preferences.language')).toHaveValue('en');
  expect(screen.getByLabelText('account.preferences.theme')).toHaveValue('light');
  expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
});

test('Edit Profile and Change Email share the same equal-width layout container', async () => {
  await renderPage();
  const editButton = screen.getByText('account.identity.editProfile');
  const emailButton = screen.getByText('account.identity.changeEmail');
  expect(editButton.parentElement).toBe(emailButton.parentElement);
  expect(editButton.parentElement).toHaveClass('acc-identity__actions');
});

test('editing display name saves through the canonical profile editor and returns to the hub', async () => {
  mockSaveProfile.mockResolvedValue({ ...baseUser, display_name: 'Fahad S.' });
  await renderPage();
  fireEvent.click(screen.getByText('account.identity.editProfile'));
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Fahad S.' } });
  await act(async () => {
    fireEvent.click(screen.getByText('profile.setup.finish'));
  });
  expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ display_name: 'Fahad S.' }));
});

test('a preference change PATCHes the profile immediately', async () => {
  mockSaveProfile.mockResolvedValue({ ...baseUser, preferred_theme: 'dark' });
  await renderPage();
  fireEvent.change(screen.getByLabelText('account.preferences.theme'), { target: { value: 'dark' } });
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ preferred_theme: 'dark' }));
});

test('a failed preference save shows a retry action instead of silently pretending it worked', async () => {
  mockSaveProfile.mockRejectedValue(new Error('network'));
  await renderPage();
  fireEvent.change(screen.getByLabelText('account.preferences.theme'), { target: { value: 'dark' } });
  await waitFor(() => expect(screen.getByText('account.errors.retry')).toBeInTheDocument());
});

test('logout invalidates the session and returns to Home', async () => {
  await renderPage();
  await act(async () => {
    fireEvent.click(screen.getByText('common.logOut'));
  });
  expect(mockLogout).toHaveBeenCalled();
  expect(await screen.findByText('home page')).toBeInTheDocument();
});

test('arriving with a `next` continuation shows a back link and returns there after saving', async () => {
  mockSaveProfile.mockResolvedValue({ ...baseUser, display_name: 'Fahad S.' });
  await renderPage({ pathname: '/account', state: { next: '/trips/join' } });
  expect(screen.getByText('common.back')).toBeInTheDocument();
  fireEvent.click(screen.getByText('account.identity.editProfile'));
  fireEvent.change(screen.getByLabelText('profile.setup.displayName'), { target: { value: 'Fahad S.' } });
  await act(async () => {
    fireEvent.click(screen.getByText('profile.setup.finish'));
  });
  expect(await screen.findByText('join trip page')).toBeInTheDocument();
});

test('a trip-history load failure is isolated -- identity and preferences still render', async () => {
  getAccountTrips.mockRejectedValue(new Error('server error'));
  await renderPage();
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByLabelText('account.preferences.theme')).toBeInTheDocument();
  expect(await screen.findByText('account.errors.tripsLoadFailed')).toBeInTheDocument();
});
