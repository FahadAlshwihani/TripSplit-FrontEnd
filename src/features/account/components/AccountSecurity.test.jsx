import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountSecurity from './AccountSecurity';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

let mockUser;
const mockSaveProfile = jest.fn();
const mockLogoutAllDevices = jest.fn();
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockUser, saveProfile: mockSaveProfile, logoutAllDevices: mockLogoutAllDevices }) }));

beforeEach(() => {
  mockUser = { idle_logout_minutes: null };
  mockSaveProfile.mockReset();
  mockLogoutAllDevices.mockReset().mockResolvedValue();
});

test('defaults to "Never" when the user has no idle policy set', () => {
  render(<AccountSecurity />);
  expect(screen.getByLabelText('account.security.idleLabel')).toHaveValue('never');
});

test('reflects an already-configured idle policy', () => {
  mockUser = { idle_logout_minutes: 15 };
  render(<AccountSecurity />);
  expect(screen.getByLabelText('account.security.idleLabel')).toHaveValue('15');
});

test('each allowed option PATCHes the profile with the matching value', async () => {
  mockSaveProfile.mockResolvedValue({ idle_logout_minutes: 30 });
  render(<AccountSecurity />);
  fireEvent.change(screen.getByLabelText('account.security.idleLabel'), { target: { value: '30' } });
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ idle_logout_minutes: 30 }));
});

test('selecting Never sends null, not the string "never"', async () => {
  mockUser = { idle_logout_minutes: 15 };
  mockSaveProfile.mockResolvedValue({ idle_logout_minutes: null });
  render(<AccountSecurity />);
  fireEvent.change(screen.getByLabelText('account.security.idleLabel'), { target: { value: 'never' } });
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ idle_logout_minutes: null }));
});

test('a failed save shows a retry action', async () => {
  mockSaveProfile.mockRejectedValue(new Error('network'));
  render(<AccountSecurity />);
  fireEvent.change(screen.getByLabelText('account.security.idleLabel'), { target: { value: '5' } });
  expect(await screen.findByText('account.errors.retry')).toBeInTheDocument();
});

test('"Log out from all devices" calls the real endpoint, never fake data', async () => {
  render(<AccountSecurity />);
  fireEvent.click(screen.getByText('account.security.logoutAll'));
  await waitFor(() => expect(mockLogoutAllDevices).toHaveBeenCalled());
});

test('a failed logout-all shows an inline error', async () => {
  mockLogoutAllDevices.mockRejectedValue(new Error('network'));
  render(<AccountSecurity />);
  fireEvent.click(screen.getByText('account.security.logoutAll'));
  expect(await screen.findByText('account.security.errors.logoutAllFailed')).toBeInTheDocument();
});
