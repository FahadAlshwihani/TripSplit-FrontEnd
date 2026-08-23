import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinRequestPage from './JoinRequestPage';
import { cancelJoinRequest, getJoinRequestStatus } from '../features/governance/api/governanceApi';

// A stable `t` reference (module-level, not recreated per render) --
// matching real react-i18next's own memoization -- since JoinRequestPage's
// polling effect lists `t` in its dependency array; a fresh function
// identity every render would spuriously re-fire that effect in tests.
const mockStableT = (key) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockStableT, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../features/governance/api/governanceApi', () => ({ getJoinRequestStatus: jest.fn(), cancelJoinRequest: jest.fn() }));

test('renders durable pending state and cancels the request', async () => {
  getJoinRequestStatus.mockResolvedValue({ request_id: 'r1', status: 'pending', trip: { public_id: 't1', title: 'Georgia' }, requested_at: '2026-08-19T12:00:00Z' });
  cancelJoinRequest.mockResolvedValue({});
  render(<MemoryRouter initialEntries={['/join-request/r1']}><Routes><Route path="/join-request/:requestId" element={<JoinRequestPage />} /><Route path="/" element={<p>home</p>} /></Routes></MemoryRouter>);
  expect(await screen.findByText('Georgia')).toBeInTheDocument();
  expect(screen.getByText('joinRequest.waiting')).toBeInTheDocument();
  fireEvent.click(screen.getByText('joinRequest.cancel'));
  await waitFor(() => expect(cancelJoinRequest).toHaveBeenCalledWith('r1', null));
  expect(await screen.findByText('home')).toBeInTheDocument();
});

test('renders the rejected state', async () => {
  getJoinRequestStatus.mockResolvedValue({ request_id: 'r1', status: 'rejected', trip: { public_id: 't1', title: 'Georgia' }, requested_at: '2026-08-19T12:00:00Z' });
  render(<MemoryRouter initialEntries={['/join-request/r1']}><Routes><Route path="/join-request/:requestId" element={<JoinRequestPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText('joinRequest.rejected')).toBeInTheDocument();
  expect(screen.queryByText('joinRequest.cancel')).not.toBeInTheDocument();
});

test('renders the banned state on a still-pending request instead of a plain "waiting" message', async () => {
  getJoinRequestStatus.mockResolvedValue({ request_id: 'r1', status: 'pending', banned: true, banned_until: null, trip: { public_id: 't1', title: 'Georgia' }, requested_at: '2026-08-19T12:00:00Z' });
  render(<MemoryRouter initialEntries={['/join-request/r1']}><Routes><Route path="/join-request/:requestId" element={<JoinRequestPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText('joinRequest.banned')).toBeInTheDocument();
  expect(screen.queryByText('joinRequest.waiting')).not.toBeInTheDocument();
});

test('accepted status navigates directly into the trip overview', async () => {
  getJoinRequestStatus.mockResolvedValue({ request_id: 'r1', status: 'accepted', trip: { public_id: 't1', title: 'Georgia' }, requested_at: '2026-08-19T12:00:00Z' });
  render(
    <MemoryRouter initialEntries={['/join-request/r1']}>
      <Routes>
        <Route path="/join-request/:requestId" element={<JoinRequestPage />} />
        <Route path="/trips/:id/overview" element={<p>trip workspace overview</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByText('trip workspace overview')).toBeInTheDocument();
});

test('re-polls status every 12 seconds while pending', async () => {
  jest.useFakeTimers();
  getJoinRequestStatus.mockResolvedValue({ request_id: 'r1', status: 'pending', trip: { public_id: 't1', title: 'Georgia' }, requested_at: '2026-08-19T12:00:00Z' });
  render(<MemoryRouter initialEntries={['/join-request/r1']}><Routes><Route path="/join-request/:requestId" element={<JoinRequestPage />} /></Routes></MemoryRouter>);
  await act(async () => {});
  expect(getJoinRequestStatus).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(12000); });
  expect(getJoinRequestStatus).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});

test('aborts status polling when the waiting page unmounts', async () => {
  let signal;
  getJoinRequestStatus.mockImplementation((_requestId, _token, config) => {
    signal = config.signal;
    return new Promise(() => {});
  });
  const view = render(<MemoryRouter initialEntries={['/join-request/r1']}><Routes><Route path="/join-request/:requestId" element={<JoinRequestPage />} /></Routes></MemoryRouter>);
  await waitFor(() => expect(signal).toBeDefined());
  view.unmount();
  expect(signal.aborted).toBe(true);
});
