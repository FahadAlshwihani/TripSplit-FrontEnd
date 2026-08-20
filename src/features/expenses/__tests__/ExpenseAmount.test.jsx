import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpenseAmount from '../components/ExpenseAmount';

test('shows the locked original and base amounts for a foreign expense', () => {
  render(<ExpenseAmount expense={{ amount: '375.00', original_amount: '100.00', original_currency: 'USD' }} baseCurrency="SAR" />);
  expect(screen.getByText('100.00 USD')).toBeInTheDocument();
  expect(screen.getByText('≈ 375.00 SAR')).toBeInTheDocument();
});

test('shows one amount for a base-currency expense', () => {
  render(<ExpenseAmount expense={{ amount: '50.00', original_amount: '50.00', original_currency: 'SAR' }} baseCurrency="SAR" />);
  expect(screen.getByText('50.00 SAR')).toBeInTheDocument();
  expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
});
