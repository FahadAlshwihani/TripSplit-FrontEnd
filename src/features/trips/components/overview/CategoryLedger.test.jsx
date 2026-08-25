import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoryLedger from './CategoryLedger';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderLedger = (categories) => render(
  <MemoryRouter>
    <CategoryLedger categories={categories} currency="SAR" tripId="t1" />
  </MemoryRouter>,
);

test('a known system category is localized from its stable code, not the server-provided English name', () => {
  renderLedger([{ code: 'food', name: 'Food', icon_key: 'utensils', spent: '3100.00', percent_of_total: 40 }]);
  expect(screen.getByText('categories.food')).toBeInTheDocument();
  expect(screen.queryByText('Food')).not.toBeInTheDocument();
});

test('an unrecognized/custom category falls back to the server-provided name, never blank', () => {
  renderLedger([{ code: 'kayak_gear', name: 'Kayak Gear', icon_key: 'tag', spent: '200.00', percent_of_total: 10 }]);
  expect(screen.getByText('Kayak Gear')).toBeInTheDocument();
});

test('the icon tile receives the category\'s presentation color as its background', () => {
  renderLedger([{ code: 'transport', name: 'Transport', icon_key: 'car', spent: '500.00', percent_of_total: 20 }]);
  const tile = document.querySelector('.ov-category__icon');
  expect(tile).toHaveStyle({ background: 'var(--color-primary-soft)' });
  expect(tile.querySelector('.bi-car-front')).toBeInTheDocument();
});

test('an unknown category renders a safe fallback tile/icon instead of crashing', () => {
  renderLedger([{ code: 'kayak_gear', name: 'Kayak Gear', icon_key: 'some_new_icon', spent: '200.00', percent_of_total: 10 }]);
  const tile = document.querySelector('.ov-category__icon');
  expect(tile).toHaveStyle({ background: 'var(--color-surface-container)' });
  expect(tile.querySelector('.bi-tag')).toBeInTheDocument();
});

test('the progress bar fill uses the same category color as the icon tile\'s identity', () => {
  renderLedger([{ code: 'fuel', name: 'Fuel', icon_key: 'fuel', spent: '80.00', percent_of_total: 15 }]);
  const fill = document.querySelector('.ov-category__fill');
  expect(fill).toHaveStyle({ background: 'var(--color-warning)', width: '15%' });
});

test('two different categories get two different colors', () => {
  renderLedger([
    { code: 'food', name: 'Food', icon_key: 'utensils', spent: '100.00', percent_of_total: 50 },
    { code: 'transport', name: 'Transport', icon_key: 'car', spent: '100.00', percent_of_total: 50 },
  ]);
  const fills = document.querySelectorAll('.ov-category__fill');
  expect(fills).toHaveLength(2);
  expect(fills[0]).toHaveStyle({ background: 'var(--cat-orange)' });
  expect(fills[1]).toHaveStyle({ background: 'var(--color-primary)' });
});

test('the amount stays bidi-safe and uses the tabular financial numeric variant', () => {
  renderLedger([{ code: 'food', name: 'Food', icon_key: 'utensils', spent: '3100.00', percent_of_total: 40 }]);
  const amount = document.querySelector('.ov-category__amount');
  expect(amount.tagName.toLowerCase()).toBe('bdi');
  expect(amount).toHaveAttribute('dir', 'ltr');
  expect(amount).toHaveClass('money--tabular');
  expect(amount.textContent.replace(/\s+/g, ' ')).toBe('3,100.00 SAR');
});

test('an empty category ledger shows the empty-state message, not a broken/blank list', () => {
  renderLedger([]);
  expect(screen.getByText('dashboard.overview.noCategorizedExpenses')).toBeInTheDocument();
});

test('a zero-spend budgeted category shows "spent / allocated" and a 0% fill, never a fake 100%', () => {
  renderLedger([{ code: 'accommodation', name: 'Accommodation', icon_key: 'bed', spent: '0.00', percent_of_total: 0, allocated_budget: '1000.00', remaining: '1000.00', over_budget: false, utilization_percentage: 0 }]);
  expect(document.querySelector('.ov-category__amount')).toHaveTextContent('0.00');
  expect(document.querySelector('.ov-category__of')).toHaveTextContent('1,000.00');
  expect(document.querySelector('.ov-category__fill')).toHaveStyle({ width: '0%' });
  expect(document.querySelector('.ov-category--over')).not.toBeInTheDocument();
});

test('an over-budget category shows the over-budget badge and a red, capped-at-100% fill', () => {
  renderLedger([{ code: 'food', name: 'Food', icon_key: 'utensils', spent: '150.00', percent_of_total: 40, allocated_budget: '100.00', remaining: '-50.00', over_budget: true, utilization_percentage: 150 }]);
  expect(screen.getByText('dashboard.overview.overBudget')).toBeInTheDocument();
  const fill = document.querySelector('.ov-category__fill');
  expect(fill).toHaveClass('ov-category__fill--over');
  expect(fill).toHaveStyle({ width: '100%', background: 'var(--color-danger)' });
});

test('a category with no budget allocation falls back to its share of total spending, unchanged', () => {
  renderLedger([{ code: 'food', name: 'Food', icon_key: 'utensils', spent: '100.00', percent_of_total: 40, allocated_budget: null, remaining: null, over_budget: false, utilization_percentage: null }]);
  expect(document.querySelector('.ov-category__of')).not.toBeInTheDocument();
  expect(document.querySelector('.ov-category__fill')).toHaveStyle({ width: '40%' });
});
