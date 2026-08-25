import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CategoryManagerDialog from './CategoryManagerDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const categories = [
  { id: 'c1', code: 'accommodation', name: 'Accommodation', icon_key: 'bed', color: '', is_default: true },
  { id: 'c2', code: 'ski-gear', name: 'Ski Gear', icon_key: 'basket', color: 'teal', is_default: false },
];

const baseProps = {
  categories,
  budgets: [],
  currency: 'SAR',
  canManage: true,
  onCreate: jest.fn(),
  onUpdate: jest.fn(),
  onArchive: jest.fn(),
  onSetBudget: jest.fn(),
  onResetBudget: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('lists every category with its localized/custom name and a default badge only on defaults', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  expect(screen.getByText('categories.accommodation')).toBeInTheDocument();
  expect(screen.getByText('Ski Gear')).toBeInTheDocument();
  const badges = screen.getAllByText('categoriesManager.default');
  expect(badges).toHaveLength(1);
});

test('a category with no budget shows the no-budget state, not a fabricated figure', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  expect(screen.getAllByText('categoriesManager.noBudget')).toHaveLength(2);
});

test('a category with an allocated budget shows spent/allocated and flags an over-budget one', () => {
  render(<CategoryManagerDialog {...baseProps} budgets={[
    { category: 'accommodation', budget: '1000.00', spent: '400.00', remaining: '600.00' },
    { category: 'ski-gear', budget: '100.00', spent: '150.00', remaining: '-50.00' },
  ]} />);
  expect(screen.queryAllByText('categoriesManager.noBudget')).toHaveLength(0);
  expect(screen.getByText('dashboard.overview.overBudget')).toBeInTheDocument();
});

test('mutation controls (edit/archive/add) are hidden entirely for a member who cannot manage categories', () => {
  render(<CategoryManagerDialog {...baseProps} canManage={false} />);
  expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'categoriesManager.archive' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'categoriesManager.addNew' })).not.toBeInTheDocument();
});

test('a default category cannot be archived (no archive control on it), a custom one can', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  const archiveButtons = screen.getAllByRole('button', { name: 'categoriesManager.archive' });
  expect(archiveButtons).toHaveLength(1);
});

test('editing a custom category exposes icon and color pickers; a default category cannot rename/re-icon/recolor', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  const editButtons = screen.getAllByRole('button', { name: 'common.edit' });
  fireEvent.click(editButtons[1]); // Ski Gear (custom)
  expect(screen.getByText('categoriesManager.icon')).toBeInTheDocument();
  expect(screen.getByText('categoriesManager.color')).toBeInTheDocument();
});

test('creating a new category calls onCreate with the chosen name/icon/color', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: 'categoriesManager.addNew' }));
  fireEvent.change(screen.getByLabelText('categoriesManager.namePlaceholder'), { target: { value: 'Diving Gear' } });
  fireEvent.click(screen.getByRole('button', { name: 'teal' }));
  fireEvent.click(screen.getByRole('button', { name: 'categoriesManager.create' }));
  expect(baseProps.onCreate).toHaveBeenCalledWith({ name: 'Diving Gear', icon_key: 'tag', color: 'teal' });
});

test('archiving a category calls onArchive with its id', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: 'categoriesManager.archive' }));
  expect(baseProps.onArchive).toHaveBeenCalledWith('c2');
});

test('setting a budget while editing calls onSetBudget with the category code', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  const editButtons = screen.getAllByRole('button', { name: 'common.edit' });
  fireEvent.click(editButtons[0]); // Accommodation (default)
  fireEvent.change(screen.getByLabelText('categoriesManager.budgetPlaceholder'), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
  expect(baseProps.onSetBudget).toHaveBeenCalledWith({ category: 'accommodation', budget: '500', currency: 'SAR' });
});

test('the dialog is a real accessible dialog with a heading and a close control', () => {
  render(<CategoryManagerDialog {...baseProps} />);
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('heading', { name: 'categoriesManager.title' })).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'common.close' }));
  expect(baseProps.onClose).toHaveBeenCalled();
});
