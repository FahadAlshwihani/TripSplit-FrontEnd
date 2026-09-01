import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import ActivityPage from '../pages/ActivityPage';
import { getActivity, getActivityPage } from '../api/activityApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => (Array.isArray(key) ? key[0] : key), i18n: { language: 'en' } }) }));
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

beforeEach(() => {
  getActivity.mockResolvedValue({ results: [{ id: 'one', summary: 'first' }], next: '/next' });
});

test('aborts an in-flight Load More request when activity unmounts', async () => {
  let pageSignal;
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

test('renders the toolbar (search + family filter) even when there are zero results, so a filtered-to-empty view stays recoverable', async () => {
  getActivity.mockResolvedValue({ results: [], next: null });
  renderPage();
  expect(await screen.findByText('activity.empty')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('activity.searchPlaceholder')).toBeInTheDocument();
});

test('search input debounces and re-fetches with the search filter', async () => {
  jest.useFakeTimers({ advanceTimers: true });
  renderPage();
  await screen.findByText('first');
  getActivity.mockClear();
  fireEvent.change(screen.getByPlaceholderText('activity.searchPlaceholder'), { target: { value: 'taxi' } });
  await act(async () => { jest.advanceTimersByTime(400); });
  await waitFor(() => expect(getActivity).toHaveBeenCalledWith('trip-a', expect.objectContaining({ filters: expect.objectContaining({ search: 'taxi' }) })));
  jest.useRealTimers();
});

test('choosing a family filter re-fetches with that family', async () => {
  renderPage();
  await screen.findByText('first');
  getActivity.mockClear();
  fireEvent.click(screen.getByRole('radio', { name: 'activity.family.expense' }));
  await waitFor(() => expect(getActivity).toHaveBeenCalledWith('trip-a', expect.objectContaining({ filters: expect.objectContaining({ family: 'expense' }) })));
});

test('a failed load surfaces ErrorState with retry, not a silent blank page', async () => {
  getActivity.mockRejectedValue(new Error('boom'));
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('boom');
});

test('the title and toolbar render immediately, before the activity list resolves -- with a section-scoped placeholder, not full-page NeoLoading', () => {
  getActivity.mockReturnValue(new Promise(() => {}));
  const { container } = renderPage();
  expect(screen.getByText('activity.title')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('activity.searchPlaceholder')).toBeInTheDocument();
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});
