import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExpenseDetailsDrawer from './ExpenseDetailsDrawer';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));

const fahad = { id: 'm1', display_name: 'Fahad', avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', avatar: { type: 'initials', color: 'slate' } };
const membersById = { m1: fahad, m2: saud };
const category = { code: 'accommodation', name: 'Accommodation', icon_key: 'bed', color: 'indigo' };

const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);

const baseExpense = {
  id: 'e1', title: 'Hotel Rooms', amount: '400.00', original_amount: '400.00', original_currency: 'SAR', exchange_rate: '1',
  payment_source: 'personal', category: 'accommodation', scope: 'shared', split_type: 'equal', expense_date: '2026-08-01',
  created_by: 'm1', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-01T10:00:00Z', notes: '',
  payments: [{ member_id: 'm1', amount: '400.00' }],
  shares: [{ member_id: 'm1', amount: '200.00', percentage: null, weight: null }, { member_id: 'm2', amount: '200.00', percentage: null, weight: null }],
};

const setup = (overrides = {}, props = {}) => render(
  <ExpenseDetailsDrawer
    expense={{ ...baseExpense, ...overrides }}
    category={category}
    budget={null}
    membersById={membersById}
    currency="SAR"
    canEdit
    canCreateExpense
    onEdit={jest.fn()}
    onDuplicate={jest.fn()}
    onDelete={jest.fn()}
    onClose={jest.fn()}
    {...props}
  />,
);

/*
  Regression guard for a real incident: the drawer and its backdrop
  were both portaled to document.body, but .exp-drawer had no explicit
  z-index while .exp-drawer-overlay did -- so the backdrop painted
  ABOVE the fully-rendered drawer and blocked every click inside it.
  jsdom doesn't compute real paint/stacking order (see the dedicated
  layering.test.js for the CSS-level z-index assertions), but this
  test guards the DOM half of that architecture: the backdrop and the
  drawer must be siblings under the same portal root, with the drawer
  physically reachable (not nested under/behind the backdrop), so a
  future refactor can't reintroduce "drawer inside backdrop" nesting.
*/
test('the backdrop and the drawer are siblings in the portal root, not nested inside one another', () => {
  setup();
  const backdrop = document.querySelector('.exp-drawer-overlay');
  const drawer = document.querySelector('.exp-drawer');
  expect(backdrop).toBeInTheDocument();
  expect(drawer).toBeInTheDocument();
  expect(backdrop.parentElement).toBe(drawer.parentElement);
  expect(backdrop.contains(drawer)).toBe(false);
  expect(drawer.contains(backdrop)).toBe(false);
});

test('clicking the backdrop closes the drawer; clicking inside the drawer does not', () => {
  const onClose = jest.fn();
  setup({}, { onClose });
  fireEvent.click(screen.getByText('Hotel Rooms'));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(document.querySelector('.exp-drawer-overlay'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('renders the title, category, date, and amount', () => {
  setup();
  expect(screen.getByText('Hotel Rooms')).toBeInTheDocument();
  expect(screen.getByText('categories.accommodation')).toBeInTheDocument();
  // Same-currency expense: the Amount and Converted bento cells legitimately
  // show the identical figure twice, so this asserts presence, not uniqueness.
  expect(screen.getAllByText(moneyMatcher('400.00 SAR')).length).toBeGreaterThan(0);
});

test('a foreign-currency expense shows the exchange rate row; a same-currency one omits it', () => {
  const { unmount } = setup({ original_currency: 'GEL', original_amount: '250.00', exchange_rate: '1.6', amount: '400.00' });
  expect(screen.getByText('currency.rate')).toBeInTheDocument();
  unmount();
  setup();
  expect(screen.queryByText('currency.rate')).not.toBeInTheDocument();
});

test('multiple payers render a "Paid By" breakdown with a total, and never say "paid personally"', async () => {
  setup({ payments: [{ member_id: 'm1', amount: '150.00' }, { member_id: 'm2', amount: '250.00' }] });
  expect(screen.getByText('expense.payers')).toBeInTheDocument();
  expect(await screen.findByText(moneyMatcher('150.00 SAR'))).toBeInTheDocument();
  expect(await screen.findByText(moneyMatcher('250.00 SAR'))).toBeInTheDocument();
  expect(screen.getAllByText('expenses.ledger.paidByMembers:{"count":2}').length).toBeGreaterThan(0);
});

test('a trip-fund expense with a single implicit payment row never renders a redundant Paid By panel', () => {
  setup({ payment_source: 'trip_fund', payments: [{ member_id: 'm1', amount: '400.00' }] });
  expect(screen.queryByText('expense.payers')).not.toBeInTheDocument();
  expect(screen.getByText('expenses.ledger.tripFund')).toBeInTheDocument();
});

test('the split breakdown uses the actual saved percentage/shares intent, never a reverse-guessed calculation', () => {
  setup({
    split_type: 'percentage',
    shares: [{ member_id: 'm1', amount: '300.00', percentage: '75.00', weight: null }, { member_id: 'm2', amount: '100.00', percentage: '25.00', weight: null }],
  });
  expect(screen.getByText(/75\.00%/)).toBeInTheDocument();
  expect(screen.getByText(/25\.00%/)).toBeInTheDocument();
});

test('a personal expense shows the personal scope card, not a shared split panel', () => {
  setup({ scope: 'personal', shares: [{ member_id: 'm1', amount: '400.00', percentage: null, weight: null }] });
  expect(screen.getByText('expenses.ledger.filterPersonal')).toBeInTheDocument();
  expect(screen.queryByText(/columnSplit/)).not.toBeInTheDocument();
});

test('shows a category budget context block only when a budget exists for this category', () => {
  const { unmount } = setup({}, { budget: { category: 'accommodation', budget: '1000.00', spent: '900.00', remaining: '100.00' } });
  expect(screen.getByText(/expenseComposer\.categoryBudgetHint/)).toBeInTheDocument();
  unmount();
  setup({}, { budget: null });
  expect(screen.queryByText(/expenseComposer\.categoryBudgetHint/)).not.toBeInTheDocument();
});

test('audit info shows only the real creator -- never a fabricated "Updated by" name', () => {
  setup({ updated_at: '2026-08-05T12:00:00Z' });
  expect(screen.getByText('expenses.ledger.createdBy:{"name":"Fahad"}')).toBeInTheDocument();
  expect(screen.getByText('expenses.ledger.lastUpdated')).toBeInTheDocument();
  expect(screen.queryByText(/Updated by/)).not.toBeInTheDocument();
});

test('no last-updated note when updated_at equals created_at', () => {
  setup({ created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-01T10:00:00Z' });
  expect(screen.queryByText('expenses.ledger.lastUpdated')).not.toBeInTheDocument();
});

test('footer actions respect permissions: Edit/Delete hidden, Duplicate still offered, when canEdit is false', () => {
  setup({}, { canEdit: false, canCreateExpense: true });
  expect(screen.queryByRole('button', { name: 'expense.edit' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'expense.duplicate' })).toBeInTheDocument();
});

test('Delete/Edit/Duplicate call their respective handlers', () => {
  const onEdit = jest.fn();
  const onDuplicate = jest.fn();
  const onDelete = jest.fn();
  setup({}, { onEdit, onDuplicate, onDelete });
  fireEvent.click(screen.getByRole('button', { name: 'expense.edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'expense.duplicate' }));
  fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
  expect(onEdit).toHaveBeenCalled();
  expect(onDuplicate).toHaveBeenCalled();
  expect(onDelete).toHaveBeenCalled();
});

test('Escape closes the drawer', () => {
  const onClose = jest.fn();
  setup({}, { onClose });
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});

test('clicking the close button closes the drawer', () => {
  const onClose = jest.fn();
  setup({}, { onClose });
  fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
  expect(onClose).toHaveBeenCalled();
});
