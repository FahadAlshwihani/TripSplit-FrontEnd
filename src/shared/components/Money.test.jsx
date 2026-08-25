import React from 'react';
import { render, screen } from '@testing-library/react';
import Money from './Money';

// Matches the <bdi>'s combined, whitespace-normalized text -- the number
// and currency render as separate nodes (see Money.jsx), so a plain
// getByText(exact string) can't match across the child <span>.
const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);
const getMoney = (text) => screen.getByText(moneyMatcher(text));

test('renders the number and currency as separate nodes, not one fused string', () => {
  render(<Money value="6000" currency="SAR" />);
  const node = getMoney('6,000.00 SAR');
  expect(node.querySelector('.money__currency')).toHaveTextContent('SAR');
  expect(node.textContent).not.toBe('SAR');
});

test('the wrapper is a bidi-safe <bdi dir="ltr"> isolate', () => {
  render(<Money value="6000" currency="SAR" />);
  const node = getMoney('6,000.00 SAR');
  expect(node.tagName.toLowerCase()).toBe('bdi');
  expect(node).toHaveAttribute('dir', 'ltr');
});

test('defaults to the "display" numeric variant', () => {
  render(<Money value="6000" currency="SAR" />);
  expect(getMoney('6,000.00 SAR')).toHaveClass('money--display');
});

test('variant="tabular" applies the tabular numeric class instead', () => {
  render(<Money value="1200" currency="SAR" variant="tabular" />);
  const node = getMoney('1,200.00 SAR');
  expect(node).toHaveClass('money--tabular');
  expect(node).not.toHaveClass('money--display');
});

test('renders without a currency suffix when none is given', () => {
  render(<Money value="42.5" />);
  const node = getMoney('42.50');
  expect(node.querySelector('.money__currency')).not.toBeInTheDocument();
});

test('formats with Western digits and comma grouping regardless of caller locale assumptions', () => {
  render(<Money value="1234567.89" currency="SAR" />);
  expect(getMoney('1,234,567.89 SAR')).toBeInTheDocument();
});

test('renders nothing for a null/undefined value rather than "null"/"undefined" text', () => {
  const { container: nullContainer } = render(<Money value={null} currency="SAR" />);
  expect(nullContainer).toBeEmptyDOMElement();
  const { container: undefinedContainer } = render(<Money value={undefined} currency="SAR" />);
  expect(undefinedContainer).toBeEmptyDOMElement();
});

test('a negative value keeps its sign', () => {
  render(<Money value="-142.5" currency="SAR" />);
  expect(getMoney('-142.50 SAR')).toBeInTheDocument();
});
