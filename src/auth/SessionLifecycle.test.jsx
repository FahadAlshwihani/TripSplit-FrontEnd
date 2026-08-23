import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import SessionLifecycle from './SessionLifecycle';
import { useAuth } from './AuthContext';
import { getCurrentUser } from '../features/auth/api/authApi';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../features/auth/api/authApi', () => ({ getCurrentUser: jest.fn() }));

const renderAt = (entry = '/dashboard') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/dashboard" element={<><SessionLifecycle /><p>dashboard page</p></>} />
      <Route path="/auth" element={<p>auth page</p>} />
    </Routes>
  </MemoryRouter>,
);

let expireSession;

beforeEach(() => {
  jest.useFakeTimers();
  expireSession = jest.fn();
  getCurrentUser.mockResolvedValue({ user: { email: 'fahad@example.com' } });
  useAuth.mockReturnValue({ isAuthenticated: true, expireSession, sessionExpired: false, consumeSessionExpired: jest.fn() });
});

afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

test('an authenticated, active user (recent activity) does not get expired', () => {
  renderAt();
  act(() => { window.dispatchEvent(new Event('keydown')); });
  act(() => { jest.advanceTimersByTime(4 * 60 * 1000); }); // under the 5 min threshold
  expect(expireSession).not.toHaveBeenCalled();
});

test('5 minutes with no activity calls expireSession', () => {
  renderAt();
  act(() => { jest.advanceTimersByTime(5 * 60 * 1000 + 1000); });
  expect(expireSession).toHaveBeenCalledTimes(1);
});

test('navigating (route change) counts as activity and resets the idle clock', () => {
  // SessionLifecycle mounted as a persistent sibling to <Routes> (matching
  // its real placement in AppRouter — see src/app/routes/index.jsx), so it
  // survives a route change instead of remounting.
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <SessionLifecycle />
      <Routes>
        <Route path="/dashboard" element={<p>dashboard page</p>} />
        <Route path="/other" element={<p>other page</p>} />
      </Routes>
      <Link to="/other">go</Link>
    </MemoryRouter>,
  );
  act(() => { jest.advanceTimersByTime(4 * 60 * 1000); });
  fireEvent.click(screen.getByText('go'));
  act(() => { jest.advanceTimersByTime(4 * 60 * 1000); });
  // 8 minutes elapsed total, but the route change partway through counts as
  // activity, resetting the clock — still under 5 minutes since then.
  expect(expireSession).not.toHaveBeenCalled();
});

test('heartbeat pings GET /auth/me/ at most once a minute while visible and authenticated', () => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  renderAt();
  act(() => { window.dispatchEvent(new Event('keydown')); jest.advanceTimersByTime(60 * 1000); });
  expect(getCurrentUser).toHaveBeenCalledTimes(1);
  act(() => { window.dispatchEvent(new Event('keydown')); jest.advanceTimersByTime(60 * 1000); });
  expect(getCurrentUser).toHaveBeenCalledTimes(2);
});

test('no heartbeat fires while the tab is hidden, even for an authenticated user', () => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  renderAt();
  act(() => { jest.advanceTimersByTime(2 * 60 * 1000); });
  expect(getCurrentUser).not.toHaveBeenCalled();
});

test('once sessionExpired is set, navigates to Auth with the current route preserved and clears the flag', async () => {
  const consumeSessionExpired = jest.fn();
  useAuth.mockReturnValue({ isAuthenticated: false, expireSession, sessionExpired: true, consumeSessionExpired });
  renderAt('/dashboard');
  expect(await screen.findByText('auth page')).toBeInTheDocument();
  expect(consumeSessionExpired).toHaveBeenCalled();
});
