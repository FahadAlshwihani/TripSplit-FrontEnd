import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinRequestPage from './JoinRequestPage';
import { cancelJoinRequest, getJoinRequestStatus } from '../features/governance/api/governanceApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
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
