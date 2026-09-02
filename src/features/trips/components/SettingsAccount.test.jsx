import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingsAccount from './SettingsAccount';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

let mockAuthUser = null;
let mockAuthLoading = false;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, isAuthenticated: Boolean(mockAuthUser), authLoading: mockAuthLoading }) }));

const mockNavigate = jest.fn();
let mockOutletContext = { currentMember: null };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockOutletContext,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = null;
  mockAuthLoading = false;
  mockOutletContext = { currentMember: null };
});

test('a registered user sees their real name, email, and avatar', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' };
  render(<SettingsAccount />);
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
});

test('Edit Profile navigates to the canonical /account route, never a second profile page', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' };
  render(<SettingsAccount />);
  fireEvent.click(screen.getByText('settings.account.editProfile'));
  expect(mockNavigate).toHaveBeenCalledWith('/account');
});

test('a guest sees their real trip display name and a Guest badge, never a fake email', () => {
  mockOutletContext = { currentMember: { display_name: 'Traveler', avatar: { type: 'initials', color: 'indigo' } } };
  render(<SettingsAccount />);
  expect(screen.getByText('Traveler')).toBeInTheDocument();
  expect(screen.getByText('settings.account.guestBadge')).toBeInTheDocument();
  expect(screen.queryByText(/@/)).not.toBeInTheDocument();
});

test('a guest sees a Sign In action that reuses the existing /auth page, not a new auth flow', () => {
  mockOutletContext = { currentMember: { display_name: 'Traveler', avatar: {} } };
  render(<SettingsAccount />);
  fireEvent.click(screen.getByText('settings.account.signIn'));
  expect(mockNavigate).toHaveBeenCalledWith('/auth');
});

test('while auth is still resolving, only the Account card shows a local loading placeholder -- never the whole page', () => {
  mockAuthLoading = true;
  const { container } = render(<SettingsAccount />);
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('never renders both the registered and guest variants at once', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' };
  mockOutletContext = { currentMember: { display_name: 'Traveler', avatar: {} } };
  render(<SettingsAccount />);
  expect(screen.queryByText('settings.account.guestBadge')).not.toBeInTheDocument();
  expect(screen.queryByText('settings.account.signIn')).not.toBeInTheDocument();
});
