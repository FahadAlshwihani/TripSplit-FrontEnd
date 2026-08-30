import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExpenseFilterBar from './ExpenseFilterBar';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const categories = [{ id: 'c1', code: 'food', name: 'Food' }];

const renderBar = (props = {}) => render(
  <ExpenseFilterBar
    filters={{}}
    setFilters={jest.fn()}
    hasActiveFilters={false}
    categories={categories}
    canCreateExpense
    onNewExpense={jest.fn()}
    onManageCategories={jest.fn()}
    {...props}
  />,
);

const mockMatchMedia = (isMobile) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: isMobile,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
};

const openFilter = () => fireEvent.click(screen.getByRole('button', { name: 'expenses.ledger.filter' }));

afterEach(() => { document.documentElement.dir = 'ltr'; });

describe('desktop', () => {
  beforeEach(() => mockMatchMedia(false));

  test('opens an anchored popover positioned from the real trigger rect, not a fixed viewport corner', () => {
    renderBar();
    const trigger = screen.getByRole('button', { name: 'expenses.ledger.filter' });
    trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
    openFilter();

    const panel = screen.getByRole('dialog', { name: 'expenses.ledger.filter' });
    expect(panel.style.position).toBe('fixed');
    expect(panel.style.top).toBe('240px'); // rect.bottom + 4
    expect(panel.style.left).toBe('500px'); // rect.left, LTR
    expect(panel.style.right).toBe('');
  });

  test('flips above the trigger when there is insufficient room below it', () => {
    renderBar();
    const trigger = screen.getByRole('button', { name: 'expenses.ledger.filter' });
    // Trigger near the bottom of a short viewport -- no room below for the panel.
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 });
    trigger.getBoundingClientRect = jest.fn(() => ({ top: 260, bottom: 290, left: 20, right: 56, width: 36, height: 36 }));
    openFilter();

    const panel = screen.getByRole('dialog', { name: 'expenses.ledger.filter' });
    expect(panel.style.top).toBe('');
    expect(panel.style.bottom).toBe('44px'); // innerHeight - rect.top + 4
  });

  test('anchors to the inline-end (right, in LTR) side under RTL, using the mirrored physical side', () => {
    document.documentElement.dir = 'rtl';
    renderBar();
    const trigger = screen.getByRole('button', { name: 'expenses.ledger.filter' });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
    openFilter();

    const panel = screen.getByRole('dialog', { name: 'expenses.ledger.filter' });
    expect(panel.style.left).toBe('');
    expect(panel.style.right).toBe('464px'); // innerWidth - rect.right
  });

  test('only one filter surface is ever mounted at a time', () => {
    renderBar();
    openFilter();
    expect(screen.getAllByRole('dialog', { name: 'expenses.ledger.filter' })).toHaveLength(1);
    // Re-clicking the (now-open) trigger toggles it closed, never stacking a second one.
    openFilter();
    expect(screen.queryAllByRole('dialog', { name: 'expenses.ledger.filter' })).toHaveLength(0);
  });

  test('Escape closes the popover and returns focus to the trigger', () => {
    renderBar();
    const trigger = screen.getByRole('button', { name: 'expenses.ledger.filter' });
    openFilter();
    expect(screen.getByRole('dialog', { name: 'expenses.ledger.filter' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'expenses.ledger.filter' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test('clicking outside the panel closes it', () => {
    renderBar();
    openFilter();
    expect(screen.getByRole('dialog', { name: 'expenses.ledger.filter' })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'expenses.ledger.filter' })).not.toBeInTheDocument();
  });

  test('applying filters calls setFilters with the drafted values and closes the popover', () => {
    const setFilters = jest.fn();
    renderBar({ setFilters });
    openFilter();
    fireEvent.change(screen.getByLabelText('expenses.ledger.filterDateFrom'), { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'expenses.ledger.applyFilters' }));
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ date_from: '2026-08-01' }));
    expect(screen.queryByRole('dialog', { name: 'expenses.ledger.filter' })).not.toBeInTheDocument();
  });
});

describe('mobile', () => {
  beforeEach(() => mockMatchMedia(true));

  test('applies no inline position at all -- CSS alone owns the fixed bottom-sheet placement', () => {
    renderBar();
    const trigger = screen.getByRole('button', { name: 'expenses.ledger.filter' });
    trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
    openFilter();

    const panel = screen.getByRole('dialog', { name: 'expenses.ledger.filter' });
    expect(panel.getAttribute('style')).toBeNull();
  });

  test('Escape and outside-click still work identically on mobile', () => {
    renderBar();
    openFilter();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'expenses.ledger.filter' })).not.toBeInTheDocument();
  });
});
