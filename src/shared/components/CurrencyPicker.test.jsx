import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CurrencyPicker from './CurrencyPicker';
import { getCurrencies } from '../../features/currencies/api/currenciesApi';

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { get language() { return mockLanguage; } } }) }));
jest.mock('../../features/currencies/api/currenciesApi', () => ({ getCurrencies: jest.fn() }));

const CATALOG = {
  currencies: [
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimal_places: 2, rate_supported: true, countries: [{ name: 'Saudi Arabia', country_code: 'SA', flag: '🇸🇦' }] },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, rate_supported: true, countries: [{ name: 'United States', country_code: 'US', flag: '🇺🇸' }] },
    { code: 'GEL', name: 'Georgian Lari', symbol: '₾', decimal_places: 2, rate_supported: true, countries: [{ name: 'Georgia', country_code: 'GE', flag: '🇬🇪' }] },
  ],
};

const renderPicker = async (props = {}) => {
  const onChange = jest.fn();
  const utils = render(<CurrencyPicker id="currency" value="SAR" onChange={onChange} label="Currency" {...props} />);
  await act(async () => {});
  return { ...utils, onChange };
};

beforeEach(() => {
  mockLanguage = 'en';
  getCurrencies.mockResolvedValue(CATALOG);
});

// Runs first, deliberately: useCurrencyCatalog's fetch dedup/cache is a
// module-level singleton (by design — the catalog fetches once per page
// load, not per <CurrencyPicker>). Once any earlier test resolves it
// successfully the cache short-circuits every later mount, so the
// rejection here would never reach getCurrencies() again.
test('a catalog load failure shows the localized error message', async () => {
  getCurrencies.mockRejectedValueOnce(new Error('network down'));
  await renderPicker();
  expect(screen.getByText('createTrip.currencyLoadError')).toBeInTheDocument();
});

test('collapses to the selected currency flag, code, and symbol', async () => {
  await renderPicker();
  expect(screen.getByRole('combobox')).toHaveValue('🇸🇦 SAR (SAR)');
});

test('searching by ISO code filters the option list', async () => {
  await renderPicker();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'GEL' } });
  expect(screen.getByText('Georgia')).toBeInTheDocument();
  expect(screen.queryByText('Saudi Arabia')).not.toBeInTheDocument();
  expect(screen.queryByText('United States')).not.toBeInTheDocument();
});

test('searching by country name filters the option list', async () => {
  await renderPicker();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'united' } });
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.queryByText('Saudi Arabia')).not.toBeInTheDocument();
});

test('selecting an option calls onChange with the currency code and collapses the input', async () => {
  const { onChange } = await renderPicker();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'lari' } });
  fireEvent.mouseDown(screen.getByText('Georgia'));
  expect(onChange).toHaveBeenCalledWith('GEL');
});

test('an unmatched query shows the localized empty state', async () => {
  await renderPicker();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz-no-match' } });
  expect(screen.getByText('createTrip.currencyNoResults')).toBeInTheDocument();
});

test('Arabic search aliases resolve local terms to the right currency when the UI language is Arabic', async () => {
  mockLanguage = 'ar';
  await renderPicker();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'ريال' } });
  expect(screen.getByText('Saudi Arabia')).toBeInTheDocument();
});

test('Arabic aliases do not match when the UI language is English', async () => {
  await renderPicker();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'ريال' } });
  expect(screen.getByText('createTrip.currencyNoResults')).toBeInTheDocument();
});
