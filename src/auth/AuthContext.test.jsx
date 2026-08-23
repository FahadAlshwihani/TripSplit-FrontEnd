import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { emitSessionExpired } from './sessionEvents';
import { getCurrentUser, logout } from '../features/auth/api/authApi';

jest.mock('../features/auth/api/authApi', () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
}));

const Probe = () => {
  const { status, user, isAuthenticated, sessionExpired } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email || ''}</span>
      <span data-testid="expired">{String(sessionExpired)}</span>
    </div>
  );
};

beforeEach(() => { logout.mockResolvedValue(); });

test('boots into loading, then resolves to authenticated when /auth/me/ returns a user', async () => {
  getCurrentUser.mockResolvedValue({ user: { email: 'fahad@example.com' } });
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByTestId('status')).toHaveTextContent('loading');
  await screen.findByText('authenticated');
  expect(screen.getByTestId('authed')).toHaveTextContent('true');
  expect(screen.getByTestId('email')).toHaveTextContent('fahad@example.com');
});

test('boots into anonymous when /auth/me/ returns no user', async () => {
  getCurrentUser.mockResolvedValue({ user: null });
  render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText('anonymous');
  expect(screen.getByTestId('authed')).toHaveTextContent('false');
});

test('boots into anonymous when /auth/me/ rejects (network failure, not logged in)', async () => {
  getCurrentUser.mockRejectedValue(new Error('network'));
  render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText('anonymous');
});

test('a session_expired event (from the axios interceptor) clears the authenticated user and sets sessionExpired', async () => {
  getCurrentUser.mockResolvedValue({ user: { email: 'fahad@example.com' } });
  render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText('authenticated');

  act(() => { emitSessionExpired(); });

  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(screen.getByTestId('expired')).toHaveTextContent('true');
  expect(logout).toHaveBeenCalled();
});
