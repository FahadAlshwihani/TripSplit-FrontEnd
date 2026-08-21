import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreateTripPage from './CreateTripPage';
import { createTrip } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: null, authLoading: false, logout: jest.fn() }) }));
jest.mock('../api/tripsApi', () => ({ createTrip: jest.fn() }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/create-trip']}>
    <Routes>
      <Route path="/create-trip" element={<CreateTripPage />} />
      <Route path="/trip/:id" element={<p>trip opened</p>} />
    </Routes>
  </MemoryRouter>
);

test('renders the dedicated create-trip form with guest fields for anonymous visitors', () => {
  renderPage();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.hero.createTrip');
  expect(screen.getByText('create.new.trip')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('guest.displayNamePlaceholder')).toBeInTheDocument();
});

test('submits the existing create-trip payload and navigates to the new trip', async () => {
  createTrip.mockResolvedValue({ trip: { id: 'trip-1' } });
  renderPage();
  fireEvent.change(screen.getByPlaceholderText('Trip.title'), { target: { value: 'Tokyo' } });
  fireEvent.change(screen.getByPlaceholderText('Budget'), { target: { value: '5000' } });
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Alex' } });
  fireEvent.click(screen.getByText('create.trip.button'));
  await waitFor(() => expect(createTrip).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tokyo', budget: '5000', guest_name: 'Alex' })));
  expect(await screen.findByText('trip opened')).toBeInTheDocument();
});
