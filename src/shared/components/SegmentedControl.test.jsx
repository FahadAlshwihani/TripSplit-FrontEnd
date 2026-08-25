import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedControl from './SegmentedControl';

const options = [
  { value: '', label: 'All' },
  { value: 'shared', label: 'Shared' },
  { value: 'personal', label: 'Personal' },
];

test('renders every option and marks only the current value as checked', () => {
  render(<SegmentedControl options={options} value="shared" onChange={jest.fn()} ariaLabel="Scope" />);
  expect(screen.getByRole('radio', { name: 'Shared' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByRole('radio', { name: 'Personal' })).toHaveAttribute('aria-checked', 'false');
});

test('the active option carries the is-active class the physical-press styling targets', () => {
  render(<SegmentedControl options={options} value="personal" onChange={jest.fn()} ariaLabel="Scope" />);
  expect(screen.getByRole('radio', { name: 'Personal' })).toHaveClass('is-active');
  expect(screen.getByRole('radio', { name: 'All' })).not.toHaveClass('is-active');
});

test('clicking an option calls onChange with that option\'s value', () => {
  const onChange = jest.fn();
  render(<SegmentedControl options={options} value="" onChange={onChange} ariaLabel="Scope" />);
  fireEvent.click(screen.getByRole('radio', { name: 'Shared' }));
  expect(onChange).toHaveBeenCalledWith('shared');
});

test('exposes a real radiogroup for assistive tech', () => {
  render(<SegmentedControl options={options} value="" onChange={jest.fn()} ariaLabel="Scope" />);
  expect(screen.getByRole('radiogroup', { name: 'Scope' })).toBeInTheDocument();
});
