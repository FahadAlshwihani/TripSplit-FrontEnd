import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import ActivityPage from '../pages/ActivityPage';
import { getActivity, getActivityPage } from '../api/activityApi';

jest.mock('../api/activityApi', () => ({ getActivity: jest.fn(), getActivityPage: jest.fn() }));
jest.mock('../components/ActivityPanel', () => ({ events }) => (
  <div>{events.map((event) => <span key={event.id}>{event.summary}</span>)}</div>
));

const Shell = () => <Outlet context={{ tripId: 'trip-a' }} />;
const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/trip-a/activity']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Shell />}>
        <Route path="activity" element={<ActivityPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

test('aborts an in-flight Load More request when activity unmounts', async () => {
  let pageSignal;
  getActivity.mockResolvedValue({ results: [{ id: 'one', summary: 'first' }], next: '/next' });
  getActivityPage.mockImplementation((_url, _tripId, config) => {
    pageSignal = config.signal;
    return new Promise(() => {});
  });
  const view = renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'common.loadMore' }));
  await waitFor(() => expect(pageSignal).toBeDefined());
  view.unmount();
  expect(pageSignal.aborted).toBe(true);
});
