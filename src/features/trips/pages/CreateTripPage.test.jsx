import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreateTripPage from './CreateTripPage';
import { createTrip } from '../api/tripsApi';
import { getCurrencies } from '../../currencies/api/currenciesApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: null, authLoading: false, logout: jest.fn() }) }));
jest.mock('../api/tripsApi', () => ({ createTrip: jest.fn() }));
jest.mock('../../currencies/api/currenciesApi', () => ({ getCurrencies: jest.fn() }));

const CATALOG = {
  currencies: [
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimal_places: 2, rate_supported: true, countries: [{ name: 'Saudi Arabia', country_code: 'SA', flag: '🇸🇦' }] },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, rate_supported: true, countries: [{ name: 'United States', country_code: 'US', flag: '🇺🇸' }] },
  ],
};

const renderPage = async () => {
  const utils = render(
    <MemoryRouter initialEntries={['/create-trip']}>
      <Routes>
        <Route path="/create-trip" element={<CreateTripPage />} />
        <Route path="/trips/:id/overview" element={<p>trip workspace overview</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>
  );
  // Flush the module-cached currency-catalog fetch so it settles inside act().
  await act(async () => {});
  return utils;
};

beforeEach(() => {
  getCurrencies.mockResolvedValue(CATALOG);
});

test('renders the Stitch-style create-trip sections with guest fields for anonymous visitors', async () => {
  await renderPage();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('createTrip.pageTitle');
  expect(screen.getByText('createTrip.section.overview')).toBeInTheDocument();
  expect(screen.getByText('createTrip.section.financials')).toBeInTheDocument();
  expect(screen.getByText('createTrip.section.access')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('guest.displayNamePlaceholder')).toBeInTheDocument();
});

test('blocks submission and shows a translated error when the trip name is blank', async () => {
  await renderPage();
  fireEvent.click(screen.getByText('createTrip.submit'));
  expect(screen.getByRole('alert')).toHaveTextContent('createTrip.errors.titleRequired');
  expect(createTrip).not.toHaveBeenCalled();
});

test('blocks submission when the end date is before the start date', async () => {
  await renderPage();
  fireEvent.change(screen.getByPlaceholderText('createTrip.namePlaceholder'), { target: { value: 'Tokyo' } });
  fireEvent.change(screen.getByLabelText('createTrip.startDate'), { target: { value: '2026-10-20' } });
  fireEvent.change(screen.getByLabelText('createTrip.endDate'), { target: { value: '2026-10-12' } });
  fireEvent.click(screen.getByText('createTrip.submit'));
  expect(screen.getByRole('alert')).toHaveTextContent('createTrip.errors.endBeforeStart');
  expect(createTrip).not.toHaveBeenCalled();
});

test('submits the create-trip payload and navigates directly into the new trip overview', async () => {
  createTrip.mockResolvedValue({ trip: { id: 'trip-1' } });
  await renderPage();
  fireEvent.change(screen.getByPlaceholderText('createTrip.namePlaceholder'), { target: { value: 'Tokyo' } });
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Alex' } });
  fireEvent.click(screen.getByText('createTrip.submit'));
  await waitFor(() => expect(createTrip).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tokyo', currency: 'SAR', budget: '0', join_policy: 'open', guest_name: 'Alex' })));
  expect(await screen.findByText('trip workspace overview')).toBeInTheDocument();
});

test('keeps the user on the page and shows the server error when creation fails', async () => {
  createTrip.mockRejectedValue({ response: { data: { message: 'Something broke' } } });
  await renderPage();
  fireEvent.change(screen.getByPlaceholderText('createTrip.namePlaceholder'), { target: { value: 'Tokyo' } });
  fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Alex' } });
  fireEvent.click(screen.getByText('createTrip.submit'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Something broke');
  expect(screen.queryByText('trip workspace overview')).not.toBeInTheDocument();
});

test('cancel navigates anonymous visitors to Home', async () => {
  await renderPage();
  fireEvent.click(screen.getByLabelText('common.cancel'));
  expect(screen.getByText('home page')).toBeInTheDocument();
});

describe('join policy states', () => {
  test('Open is selected by default: checked radio, active class, white/full-opacity text', async () => {
    await renderPage();
    const openRadio = screen.getByRole('radio', { name: 'joinPolicy.open' });
    expect(openRadio).toBeChecked();
    expect(openRadio.closest('label')).toHaveClass('is-active');
  });

  test('Approval required is unselected by default and is a readable, non-disabled option', async () => {
    await renderPage();
    const approvalRadio = screen.getByRole('radio', { name: 'joinPolicy.approval_required' });
    expect(approvalRadio).not.toBeChecked();
    expect(approvalRadio).not.toBeDisabled();
    expect(approvalRadio.closest('label')).not.toHaveClass('is-active');
  });

  test('Invite only is unselected by default and is a readable, non-disabled option', async () => {
    await renderPage();
    const inviteRadio = screen.getByRole('radio', { name: 'joinPolicy.invite_only' });
    expect(inviteRadio).not.toBeChecked();
    expect(inviteRadio).not.toBeDisabled();
    expect(inviteRadio.closest('label')).not.toHaveClass('is-active');
  });

  test('selecting Approval required makes it active and returns Open to a normal unselected option', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'joinPolicy.approval_required' }));
    expect(screen.getByRole('radio', { name: 'joinPolicy.approval_required' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'joinPolicy.approval_required' }).closest('label')).toHaveClass('is-active');
    expect(screen.getByRole('radio', { name: 'joinPolicy.open' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'joinPolicy.open' }).closest('label')).not.toHaveClass('is-active');
  });

  test('Arabic: the same selected/unselected state behavior holds under RTL', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    try {
      await renderPage();
      fireEvent.click(screen.getByRole('radio', { name: 'joinPolicy.invite_only' }));
      expect(screen.getByRole('radio', { name: 'joinPolicy.invite_only' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'joinPolicy.invite_only' }).closest('label')).toHaveClass('is-active');
      expect(screen.getByRole('radio', { name: 'joinPolicy.approval_required' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'joinPolicy.approval_required' })).not.toBeDisabled();
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });
});

describe('date inputs', () => {
  test('changing Start Date updates form state (reflected in the input value)', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('createTrip.startDate'), { target: { value: '2026-10-12' } });
    expect(screen.getByLabelText('createTrip.startDate')).toHaveValue('2026-10-12');
  });

  test('changing End Date updates form state (reflected in the input value)', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('createTrip.endDate'), { target: { value: '2026-10-20' } });
    expect(screen.getByLabelText('createTrip.endDate')).toHaveValue('2026-10-20');
  });

  test('End Date gets a min matching Start Date, and Start Date gets a max matching End Date', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('createTrip.startDate'), { target: { value: '2026-10-12' } });
    expect(screen.getByLabelText('createTrip.endDate')).toHaveAttribute('min', '2026-10-12');
    fireEvent.change(screen.getByLabelText('createTrip.endDate'), { target: { value: '2026-10-20' } });
    expect(screen.getByLabelText('createTrip.startDate')).toHaveAttribute('max', '2026-10-20');
  });

  test('submits dates exactly as ISO YYYY-MM-DD, never locale-formatted', async () => {
    createTrip.mockResolvedValue({ trip: { id: 'trip-1' } });
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText('createTrip.namePlaceholder'), { target: { value: 'Tokyo' } });
    fireEvent.change(screen.getByPlaceholderText('guest.displayNamePlaceholder'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('createTrip.startDate'), { target: { value: '2026-10-12' } });
    fireEvent.change(screen.getByLabelText('createTrip.endDate'), { target: { value: '2026-10-20' } });
    fireEvent.click(screen.getByText('createTrip.submit'));
    await waitFor(() => expect(createTrip).toHaveBeenCalledWith(expect.objectContaining({ start_date: '2026-10-12', end_date: '2026-10-20' })));
  });
});
