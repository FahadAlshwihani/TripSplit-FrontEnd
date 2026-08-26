import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import ExpensesPage from './ExpensesPage';
import { addExpense, deleteExpense, getExpenses, getExpensesSummary, updateExpense } from '../api/expensesApi';
import { createCategory, getCategories, getCategoryBudgets } from '../../categories/api/categoriesApi';
import { getMembers } from '../../members/api/membersApi';
import { getFund } from '../../funds/api/fundsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/expensesApi', () => ({
  getExpenses: jest.fn(),
  getExpensesSummary: jest.fn(),
  getPage: jest.fn(),
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));
jest.mock('../../categories/api/categoriesApi', () => ({
  getCategories: jest.fn(),
  getCategoryBudgets: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  archiveCategory: jest.fn(),
  setCategoryBudget: jest.fn(),
  resetCategoryBudget: jest.fn(),
}));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));
jest.mock('../../funds/api/fundsApi', () => ({ getFund: jest.fn() }));
jest.mock('../../../shared/components/useCurrencyCatalog', () => ({
  __esModule: true,
  default: () => ({ currencies: [{ code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', countries: [{ name: 'Saudi Arabia', flag: '🇸🇦' }] }, { code: 'GEL', name: 'Georgian Lari', symbol: '₾', countries: [{ name: 'Georgia', flag: '🇬🇪' }] }], error: null }),
}));

const summary = { currency: 'SAR', total_spent: '5940.00', from_trip_fund: '3200.00', paid_personally: '2740.00', my_out_of_pocket: '850.00' };
const categories = [
  { id: 'c1', code: 'accommodation', name: 'Accommodation', icon_key: 'bed' },
  { id: 'c2', code: 'transport', name: 'Transport', icon_key: 'car' },
];
const fahad = { id: 'm1', display_name: 'Fahad', avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', avatar: { type: 'initials', color: 'slate' } };
const members = [fahad, saud];

const hotelExpense = {
  id: 'e1', title: 'Hotel Rooms — Tbilisi', amount: '1650.00', original_amount: '1200.00', original_currency: 'GEL', exchange_rate: '1.375',
  payment_source: 'trip_fund', category: 'accommodation', scope: 'shared', split_type: 'equal', expense_date: '2026-12-15',
  created_by: 'm1', notes: '', payments: [], shares: [{ member_id: 'm1', amount: '412.50', percentage: null, weight: null }, { member_id: 'm2', amount: '412.50', percentage: null, weight: null }],
};
const taxiExpense = {
  id: 'e2', title: 'Airport Taxi', amount: '140.00', original_amount: '140.00', original_currency: 'SAR', exchange_rate: '1',
  payment_source: 'personal', category: 'transport', scope: 'shared', split_type: 'equal', expense_date: '2026-12-14',
  created_by: 'm2', notes: '', payments: [{ member_id: 'm2', amount: '140.00' }], shares: [{ member_id: 'm1', amount: '70.00', percentage: null, weight: null }, { member_id: 'm2', amount: '70.00', percentage: null, weight: null }],
};
const coffeeExpense = {
  id: 'e3', title: 'Coffee', amount: '28.00', original_amount: '28.00', original_currency: 'SAR', exchange_rate: '1',
  payment_source: 'personal', category: 'accommodation', scope: 'personal', split_type: 'equal', expense_date: '2026-12-14',
  created_by: 'm1', notes: '', payments: [{ member_id: 'm1', amount: '28.00' }], shares: [{ member_id: 'm1', amount: '28.00', percentage: null, weight: null }],
};

const baseList = { results: [hotelExpense, taxiExpense, coffeeExpense], next: null, previous: null, count: 3 };

const permissions = {
  canCreateExpense: true,
  canManageMembers: true,
  canEditExpense: (expense) => expense.created_by === 'm1',
};

const trip = { currency: 'SAR' };

const renderPage = (entry = '/trips/t1/expenses') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions }} />}>
        <Route path="expenses" element={<ExpensesPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);
const findMoney = (text) => screen.findByText(moneyMatcher(text));

beforeEach(() => {
  jest.clearAllMocks();
  getExpensesSummary.mockResolvedValue(summary);
  getCategories.mockResolvedValue({ results: categories });
  getCategoryBudgets.mockResolvedValue({ results: [] });
  getMembers.mockResolvedValue({ results: members });
  getFund.mockResolvedValue({ status: 'active' });
  getExpenses.mockResolvedValue(baseList);
});

test('renders the four authoritative summary figures from the summary endpoint', async () => {
  renderPage();
  expect(await findMoney('5,940.00 SAR')).toBeInTheDocument();
  expect(await findMoney('3,200.00 SAR')).toBeInTheDocument();
  expect(await findMoney('2,740.00 SAR')).toBeInTheDocument();
  expect(await findMoney('850.00 SAR')).toBeInTheDocument();
});

test('renders real expense rows with title, category, payment, and split details', async () => {
  renderPage();
  expect(await screen.findByText('Hotel Rooms — Tbilisi')).toBeInTheDocument();
  expect(screen.getByText('Airport Taxi')).toBeInTheDocument();
  expect(screen.getByText('Coffee')).toBeInTheDocument();
  // Trip-fund row
  expect(screen.getByText('expenses.ledger.tripFund')).toBeInTheDocument();
  // Single-payer row
  expect(screen.getByText('expenses.ledger.paidBy:{"name":"Saud"}')).toBeInTheDocument();
  // Personal-scope row (Coffee)
  const coffeeRow = screen.getByText('Coffee').closest('.exp-ledger__row');
  expect(within(coffeeRow).getByText('expenses.ledger.filterPersonal')).toBeInTheDocument();
});

test('a foreign-currency expense shows the original amount and the converted trip-currency amount', async () => {
  renderPage();
  expect(await findMoney('1,200.00 GEL')).toBeInTheDocument();
  expect(await findMoney('1,650.00 SAR')).toBeInTheDocument();
});

test('search input debounces and re-fetches the list with the search query param', async () => {
  jest.useFakeTimers({ advanceTimers: true });
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  getExpenses.mockClear();
  fireEvent.change(screen.getByPlaceholderText('expenses.ledger.searchPlaceholder'), { target: { value: 'taxi' } });
  await act(async () => { jest.advanceTimersByTime(400); });
  await waitFor(() => expect(getExpenses).toHaveBeenCalledWith('t1', expect.objectContaining({ params: expect.objectContaining({ search: 'taxi' }) })));
  jest.useRealTimers();
});

test('the All/Shared/Personal segmented control re-fetches with the scope param', async () => {
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  getExpenses.mockClear();
  fireEvent.click(screen.getByRole('radio', { name: 'expenses.ledger.filterShared' }));
  await waitFor(() => expect(getExpenses).toHaveBeenCalledWith('t1', expect.objectContaining({ params: expect.objectContaining({ scope: 'shared' }) })));
});

test('an empty result set (no expenses at all) shows the primary empty state', async () => {
  getExpenses.mockResolvedValue({ results: [], next: null });
  renderPage();
  expect(await screen.findByText('expenses.ledger.emptyTitle')).toBeInTheDocument();
  expect(screen.getByText('expenses.ledger.emptyBody')).toBeInTheDocument();
});

test('an empty result set caused by an active filter shows the filtered-empty state, not the primary one', async () => {
  getExpenses.mockResolvedValue({ results: [], next: null });
  renderPage('/trips/t1/expenses?scope=personal');
  expect(await screen.findByText('expenses.ledger.emptyFiltered')).toBeInTheDocument();
  expect(screen.queryByText('expenses.ledger.emptyTitle')).not.toBeInTheDocument();
});

test('a list load failure shows a retry action without destroying the summary cards', async () => {
  getExpenses.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await findMoney('5,940.00 SAR')).toBeInTheDocument();
  expect(await screen.findByText('expenses.ledger.errorLoad')).toBeInTheDocument();
});

test('New Expense opens the canonical composer with its core fields', async () => {
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  fireEvent.click(screen.getByRole('button', { name: 'expenses.ledger.newExpense' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.description')).toBeInTheDocument();
  expect(screen.getByLabelText('expense.amount')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'expense.add' })).toBeInTheDocument();
});

test('New Expense is hidden entirely for a member without canCreateExpense (e.g. a read-only archived trip)', async () => {
  render(
    <MemoryRouter initialEntries={['/trips/t1/expenses']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions: { ...permissions, canCreateExpense: false } }} />}>
          <Route path="expenses" element={<ExpensesPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText('Hotel Rooms — Tbilisi');
  expect(screen.queryByRole('button', { name: 'expenses.ledger.newExpense' })).not.toBeInTheDocument();
});

test('submitting the New Expense composer calls addExpense (with a fresh idempotency key) and refreshes the list and summary', async () => {
  addExpense.mockResolvedValue({});
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  fireEvent.click(screen.getByRole('button', { name: 'expenses.ledger.newExpense' }));
  await screen.findByRole('dialog');
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '25' } });
  fireEvent.change(screen.getByLabelText('expense.description'), { target: { value: 'Snacks' } });
  getExpenses.mockClear();
  getExpensesSummary.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'expense.add' }));
  await waitFor(() => expect(addExpense).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Snacks', amount: '25', idempotency_key: expect.any(String) })));
  await waitFor(() => expect(getExpenses).toHaveBeenCalled());
  await waitFor(() => expect(getExpensesSummary).toHaveBeenCalled());
});

test('the Categories button opens the category manager with the trip\'s real categories', async () => {
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  fireEvent.click(screen.getByRole('button', { name: 'categoriesManager.title' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('categories.accommodation');
  expect(dialog).toHaveTextContent('categories.transport');
});

test('creating a category in the manager calls createCategory and refreshes the category list', async () => {
  createCategory.mockResolvedValue({});
  getCategoryBudgets.mockResolvedValue({ results: [] });
  renderPage();
  await screen.findByText('Hotel Rooms — Tbilisi');
  fireEvent.click(screen.getByRole('button', { name: 'categoriesManager.title' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'categoriesManager.addNew' }));
  fireEvent.change(within(dialog).getByLabelText('categoriesManager.namePlaceholder'), { target: { value: 'Ski Gear' } });
  getCategories.mockClear();
  fireEvent.click(within(dialog).getByRole('button', { name: 'categoriesManager.create' }));
  await waitFor(() => expect(createCategory).toHaveBeenCalledWith('t1', expect.objectContaining({ name: 'Ski Gear' })));
  await waitFor(() => expect(getCategories).toHaveBeenCalled());
});

test('clicking a row opens the details dialog with the full record', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Airport Taxi'));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Airport Taxi');
  expect(dialog).toHaveTextContent('Saud');
});

test('Edit/Delete are offered on a row the current member is allowed to edit', async () => {
  renderPage();
  // Coffee was created by m1 (the current member) -- edit/delete allowed.
  fireEvent.click(await screen.findByText('Coffee'));
  const drawer = await screen.findByRole('dialog');
  expect(within(drawer).getByRole('button', { name: 'expense.edit' })).toBeInTheDocument();
  expect(within(drawer).getByRole('button', { name: 'common.delete' })).toBeInTheDocument();
});

test('Edit/Delete are hidden on a row the current member is not allowed to edit', async () => {
  renderPage();
  // Airport Taxi was created by m2 (Saud), not the current member (Fahad).
  fireEvent.click(await screen.findByText('Airport Taxi'));
  const drawer = await screen.findByRole('dialog');
  expect(within(drawer).queryByRole('button', { name: 'expense.edit' })).not.toBeInTheDocument();
  expect(within(drawer).queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
});

test('Delete opens the canonical confirm dialog (not window.confirm) before calling deleteExpense', async () => {
  const confirmSpy = jest.spyOn(window, 'confirm');
  deleteExpense.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByText('Coffee'));
  const drawer = await screen.findByRole('dialog');
  fireEvent.click(within(drawer).getByRole('button', { name: 'common.delete' }));
  const confirm = await screen.findByRole('alertdialog');
  expect(confirmSpy).not.toHaveBeenCalled();
  fireEvent.click(within(confirm).getByRole('button', { name: 'expenses.ledger.deleteConfirm' }));
  await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('t1', 'e3'));
  confirmSpy.mockRestore();
});

test('Delete does not call the API if the confirmation is cancelled', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Coffee'));
  const drawer = await screen.findByRole('dialog');
  fireEvent.click(within(drawer).getByRole('button', { name: 'common.delete' }));
  const confirm = await screen.findByRole('alertdialog');
  fireEvent.click(within(confirm).getByRole('button', { name: 'common.cancel' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(deleteExpense).not.toHaveBeenCalled();
});

test('Escape closes an open dialog', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Coffee'));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
