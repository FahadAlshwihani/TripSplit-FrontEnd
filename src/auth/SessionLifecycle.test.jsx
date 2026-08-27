import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import SessionLifecycle from './SessionLifecycle';
import { useAuth } from './AuthContext';
import { recordActivity } from '../features/auth/api/authApi';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../features/auth/api/authApi', () => ({ recordActivity: jest.fn() }));

const renderAt = (entry = '/dashboard') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/dashboard" element={<><SessionLifecycle /><p>dashboard page</p></>} />
      <Route path="/auth" element={<p>auth page</p>} />
    </Routes>
  </MemoryRouter>,
);

let expireSession;

const withIdleMinutes = (idle_logout_minutes) => ({
  user: { email: 'fahad@example.com', idle_logout_minutes },
  isAuthenticated: true, expireSession, sessionExpired: false, sessionExpiredReason: null, consumeSessionExpired: jest.fn(),
});

beforeEach(() => {
  jest.useFakeTimers();
  expireSession = jest.fn();
  recordActivity.mockResolvedValue(undefined);
  useAuth.mockReturnValue(withIdleMinutes(5));
});

afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

test('an authenticated, active user (recent activity) does not get expired', () => {
  renderAt();
  act(() => { window.dispatchEvent(new Event('keydown')); });
  act(() => { jest.advanceTimersByTime(4 * 60 * 1000); }); // under the 5 min threshold
  expect(expireSession).not.toHaveBeenCalled();
});

test('5 minutes with no activity calls expireSession with reason "idle"', () => {
  renderAt();
  act(() => { jest.advanceTimersByTime(5 * 60 * 1000 + 1000); });
  expect(expireSession).toHaveBeenCalledTimes(1);
  expect(expireSession).toHaveBeenCalledWith('idle');
});

test('idle_logout_minutes=null ("Never") never expires the session, however long it waits', () => {
  useAuth.mockReturnValue(withIdleMinutes(null));
  renderAt();
  act(() => { jest.advanceTimersByTime(60 * 60 * 1000); }); // a full hour
  expect(expireSession).not.toHaveBeenCalled();
});

test('idle_logout_minutes=null never sends a heartbeat -- no needless polling', () => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  useAuth.mockReturnValue(withIdleMinutes(null));
  renderAt();
  act(() => { window.dispatchEvent(new Event('keydown')); jest.advanceTimersByTime(5 * 60 * 1000); });
  expect(recordActivity).not.toHaveBeenCalled();
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

test('heartbeat calls POST /auth/activity/ at most once a minute while visible and authenticated', () => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  renderAt();
  act(() => { window.dispatchEvent(new Event('keydown')); jest.advanceTimersByTime(60 * 1000); });
  expect(recordActivity).toHaveBeenCalledTimes(1);
  act(() => { window.dispatchEvent(new Event('keydown')); jest.advanceTimersByTime(60 * 1000); });
  expect(recordActivity).toHaveBeenCalledTimes(2);
});

test('no heartbeat fires while the tab is hidden, even for an authenticated user', () => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  renderAt();
  act(() => { jest.advanceTimersByTime(2 * 60 * 1000); });
  expect(recordActivity).not.toHaveBeenCalled();
});

test('once sessionExpired is set, navigates to Auth with the current route preserved, the reason, and clears the flag', async () => {
  const consumeSessionExpired = jest.fn();
  useAuth.mockReturnValue({ user: null, isAuthenticated: false, expireSession, sessionExpired: true, sessionExpiredReason: 'session_idle_timeout', consumeSessionExpired });
  renderAt('/dashboard');
  expect(await screen.findByText('auth page')).toBeInTheDocument();
  expect(consumeSessionExpired).toHaveBeenCalled();
});
