import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JoinTripPage from './JoinTripPage';
import { joinTrip } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: null, authLoading: false, logout: jest.fn() }) }));
jest.mock('../api/tripsApi', () => ({ joinTrip: jest.fn() }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/join-trip']}>
    <Routes>
      <Route path="/join-trip" element={<JoinTripPage />} />
      <Route path="/trip/:id" element={<p>trip opened</p>} />
      <Route path="/join-request/:id" element={<p>join request pending</p>} />
    </Routes>
  </MemoryRouter>
);

test('renders the dedicated join-trip form with guest fields for anonymous visitors', () => {
  renderPage();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.hero.joinTrip');
  expect(screen.getByText('join.existing.trip')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('guest.displayNamePlaceholder')).toBeInTheDocument();
});

test('joining an open trip navigates straight into the trip', async () => {
  joinTrip.mockResolvedValue({ trip: { id: 'trip-1' } });
  renderPage();
  fireEvent.change(screen.getByPlaceholderText('enter.trip.code'), { target: { value: 'abc123' } });
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Sam' } });
  fireEvent.click(screen.getByText('join.trip.button'));
  await waitFor(() => expect(joinTrip).toHaveBeenCalledWith(expect.objectContaining({ join_code: 'ABC123', guest_name: 'Sam' })));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});

test('an approval-required trip routes to the join-request pending page', async () => {
  joinTrip.mockResolvedValue({ join_request: { id: 'req-1' }, request_token: 'tok' });
  renderPage();
  fireEvent.change(screen.getByPlaceholderText('enter.trip.code'), { target: { value: 'xyz789' } });
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Sam' } });
  fireEvent.click(screen.getByText('join.trip.button'));
  expect(await screen.findByText('join request pending')).toBeInTheDocument();
});
