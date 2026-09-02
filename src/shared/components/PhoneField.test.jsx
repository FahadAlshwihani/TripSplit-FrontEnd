import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PhoneField from './PhoneField';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('renders one coherent control -- a country-code select and a number input, both required', () => {
  render(<PhoneField id="phone" countryCode="+966" onCountryCodeChange={jest.fn()} number="" onNumberChange={jest.fn()} />);
  expect(screen.getByLabelText('support.form.phone')).toBeRequired();
});

test('the number input always stays LTR, regardless of page direction', () => {
  render(<PhoneField id="phone" countryCode="+966" onCountryCodeChange={jest.fn()} number="501234567" onNumberChange={jest.fn()} />);
  expect(screen.getByLabelText('support.form.phone')).toHaveAttribute('dir', 'ltr');
});

test('changing the country code and the number call their own distinct handlers', () => {
  const onCountryCodeChange = jest.fn();
  const onNumberChange = jest.fn();
  render(<PhoneField id="phone" countryCode="+966" onCountryCodeChange={onCountryCodeChange} number="" onNumberChange={onNumberChange} />);
  fireEvent.change(screen.getByLabelText('support.form.phoneCountryCode'), { target: { value: '+1' } });
  expect(onCountryCodeChange).toHaveBeenCalledWith('+1');
  fireEvent.change(screen.getByLabelText('support.form.phone'), { target: { value: '5551234' } });
  expect(onNumberChange).toHaveBeenCalledWith('5551234');
});

test('shows the field-level error message when one is passed', () => {
  render(<PhoneField id="phone" countryCode="+966" onCountryCodeChange={jest.fn()} number="" onNumberChange={jest.fn()} error="Enter a valid phone number." />);
  expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();
});
