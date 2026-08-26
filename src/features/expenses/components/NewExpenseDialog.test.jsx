import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import NewExpenseDialog from './NewExpenseDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../../../shared/components/useCurrencyCatalog', () => ({
  __esModule: true,
  default: () => ({ currencies: [{ code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', countries: [{ name: 'Saudi Arabia', flag: '🇸🇦' }] }, { code: 'GEL', name: 'Georgian Lari', symbol: '₾', countries: [{ name: 'Georgia', flag: '🇬🇪' }] }], error: null }),
}));

const fahad = { id: 'm1', display_name: 'Fahad', avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', avatar: { type: 'initials', color: 'slate' } };
const members = [fahad, saud];
const categories = [
  { id: 'c1', code: 'accommodation', name: 'Accommodation', icon_key: 'bed', color: 'indigo' },
  { id: 'c2', code: 'transport', name: 'Transport', icon_key: 'car', color: 'teal' },
];
const budgets = [{ category: 'accommodation', budget: '1000.00', spent: '900.00', remaining: '100.00', usage_percentage: '90.00' }];
const activeFund = { status: 'active', accounting: { balance: '500.00' } };

const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);

const setup = (props = {}) => render(
  <NewExpenseDialog
    members={members}
    categories={categories}
    budgets={budgets}
    currentMember={fahad}
    tripCurrency="SAR"
    fund={activeFund}
    expense={null}
    onSubmit={jest.fn()}
    onClose={jest.fn()}
    {...props}
  />,
);

/*
  Regression guard for a real incident: ExpenseComposerDetails crashed
  in the browser with "Element type is invalid... expected a string
  ... but got: undefined", which React only throws when a JSX tag
  itself resolves to an undefined value at render time. Static analysis
  (webpack build, ESLint) did not catch it -- it was a stale dev-server
  module-graph artifact (mass file deletions earlier in this session
  while an old `npm start` process kept running), and none of the
  section components were ever mocked away in these tests, so this
  suite already exercises the real import graph end to end. This test
  makes that guarantee explicit: it renders the composer with no child
  component mocked (only the network-bound useCurrencyCatalog hook is
  stubbed) and fails loudly -- via a thrown render error, not a silent
  console message -- if any child ever again resolves to undefined.
*/
test('the composer renders with every section\'s real, unmocked component tree and never logs a React element-type error', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  setup();
  expect(screen.getByLabelText('expense.description')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.category')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.date')).toBeInTheDocument();
  expect(screen.getByLabelText('currency.original')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.amount')).toBeInTheDocument();
  const loggedErrors = consoleError.mock.calls.map((call) => call.join(' ')).join('\n');
  expect(loggedErrors).not.toMatch(/Element type is invalid/);
  consoleError.mockRestore();
});

test('renders all four canonical sections plus notes', () => {
  setup();
  expect(screen.getByText('expenseComposer.sections.details')).toBeInTheDocument();
  expect(screen.getByText('expenseComposer.sections.payment')).toBeInTheDocument();
  expect(screen.getByText('expenseComposer.sections.participants')).toBeInTheDocument();
  expect(screen.getByText('expenseComposer.sections.split')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.notes')).toBeInTheDocument();
});

test('switching to Personal collapses payment and split into single-owner displays', () => {
  setup();
  fireEvent.click(screen.getByRole('radio', { name: 'expense.scope.personal' }));
  expect(screen.getByText(/expenseComposer\.paidPersonallyByYou/)).toBeInTheDocument();
  expect(screen.getByText(/expenseComposer\.personalOwner/)).toBeInTheDocument();
  expect(screen.queryByText('expenseComposer.sections.split')).not.toBeInTheDocument();
});

test('choosing Trip Fund shows an available/this-expense/after preview and warns when it exceeds the balance', () => {
  setup();
  fireEvent.click(screen.getByRole('radio', { name: 'expenses.ledger.tripFund' }));
  expect(screen.getByText('expenseComposer.fundAvailable')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '900' } });
  const alerts = screen.getAllByRole('alert').map((node) => node.textContent);
  expect(alerts).toContain('expenseComposer.fundExceedsWarning');
});

test('a lone payer never needs a separate amount input, and the payment total is already satisfied', () => {
  setup();
  expect(screen.getByText('expenseComposer.paymentsComplete')).toBeInTheDocument();
  expect(screen.queryByLabelText(/paidAmount/)).not.toBeInTheDocument();
});

test('adding a second payer requires explicit per-payer amounts that must sum to the total', () => {
  setup();
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '100' } });
  // "Saud" appears both in the payment member list and the participants
  // list below it -- the payment section's row is the first occurrence.
  fireEvent.click(screen.getAllByText('Saud')[0]);
  expect(screen.getAllByLabelText(/expense\.paidAmount/)).toHaveLength(2);
  fireEvent.change(screen.getAllByLabelText(/expense\.paidAmount/)[0], { target: { value: '60' } });
  fireEvent.change(screen.getAllByLabelText(/expense\.paidAmount/)[1], { target: { value: '60' } });
  expect(screen.getByText(/expense\.remaining/)).toBeInTheDocument();
});

test('the category budget hint shows spent/allocated for a budgeted category', async () => {
  setup();
  expect(await screen.findByText(moneyMatcher('900.00 SAR'))).toBeInTheDocument();
  expect(await screen.findByText(moneyMatcher('1,000.00 SAR'))).toBeInTheDocument();
});

test('switching split method to Percentage renders per-participant percentage inputs and a running total', () => {
  setup();
  fireEvent.click(screen.getByRole('radio', { name: 'split.percentage' }));
  const inputs = screen.getAllByRole('spinbutton').filter((input) => input.closest('.exp-composer__split-row-percent'));
  fireEvent.change(inputs[0], { target: { value: '60' } });
  fireEvent.change(inputs[1], { target: { value: '40' } });
  expect(screen.getByText('100%')).toBeInTheDocument();
});

test('edit mode hydrates every field from the existing expense', () => {
  const expense = {
    id: 'e1', title: 'Hotel', amount: '400.00', original_amount: '400.00', original_currency: 'SAR', exchange_rate: '1',
    payment_source: 'personal', category: 'accommodation', scope: 'shared', split_type: 'equal', expense_date: '2026-08-01', notes: 'note here',
    payments: [{ member_id: 'm1', amount: '400.00' }],
    shares: [{ member_id: 'm1', amount: '200.00', percentage: null, weight: null }, { member_id: 'm2', amount: '200.00', percentage: null, weight: null }],
  };
  setup({ expense });
  expect(screen.getByDisplayValue('Hotel')).toBeInTheDocument();
  expect(screen.getByDisplayValue('400.00')).toBeInTheDocument();
  expect(screen.getByDisplayValue('note here')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'expense.save' })).toBeInTheDocument();
});

test('the submit button is disabled until the form is valid, and shows a loading spinner while submitting without changing its label away from readability', async () => {
  let resolveSubmit;
  const onSubmit = jest.fn(() => new Promise((resolve) => { resolveSubmit = resolve; }));
  setup({ onSubmit });
  const submitBtn = screen.getByRole('button', { name: 'expense.add' });
  expect(submitBtn).toBeDisabled();
  fireEvent.change(screen.getByLabelText('expense.description'), { target: { value: 'Snacks' } });
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '25' } });
  expect(submitBtn).not.toBeDisabled();
  fireEvent.click(submitBtn);
  expect(submitBtn).toHaveClass('dash-btn--loading');
  expect(submitBtn).toHaveTextContent('expense.add');
  resolveSubmit();
  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
});

test('a duplicate expense (expense.duplicate === true) still reads as a create, not an edit', () => {
  const expense = {
    id: 'e1', duplicate: true, title: 'Hotel', amount: '400.00', original_amount: '400.00', original_currency: 'SAR', exchange_rate: '1',
    payment_source: 'personal', category: 'accommodation', scope: 'shared', split_type: 'equal', expense_date: '2026-08-01', notes: '',
    payments: [{ member_id: 'm1', amount: '400.00' }],
    shares: [{ member_id: 'm1', amount: '400.00', percentage: null, weight: null }],
  };
  setup({ expense });
  expect(screen.getByRole('button', { name: 'expense.add' })).toBeInTheDocument();
  expect(screen.getByText('expenseComposer.duplicateSubtitle')).toBeInTheDocument();
});

test('Escape closes the dialog', () => {
  const onClose = jest.fn();
  setup({ onClose });
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
