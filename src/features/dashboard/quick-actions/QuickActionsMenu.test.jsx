import React, { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuickActionsMenu from './QuickActionsMenu';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
const mockChangeLanguage = jest.fn();
const mockChangeTheme = jest.fn();
jest.mock('../../account/hooks/usePreferenceControls', () => () => ({
  language: 'en', theme: 'light', changeLanguage: mockChangeLanguage, changeTheme: mockChangeTheme, status: {}, authLoading: false,
}));

function Harness({ capabilities = { expense: true, member: true, fundingRound: true, settlement: true, support: true, account: true } }) {
  const [state, setState] = useState(null);
  const triggerRef = useRef(null);
  return (
    <QuickActionsMenu
      surface="mobile"
      state={state}
      triggerRef={triggerRef}
      capabilities={capabilities}
      onOpen={(surface) => setState({ type: 'menu', surface })}
      onClose={() => {
        setState(null);
        triggerRef.current?.focus();
      }}
      onSelect={(type, surface) => setState({ type, surface })}
    />
  );
}

test('opens one grouped accessible menu containing all capability-approved actions and preferences', () => {
  render(<Harness />);
  const launcher = screen.getByRole('button', { name: 'dashboard.quickActions' });
  expect(launcher).toHaveAttribute('aria-haspopup', 'menu');
  expect(launcher).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(launcher);

  expect(launcher).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsExpense' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsMember' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsFundingRound' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSettlement' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSupport' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsAccount' })).toBeInTheDocument();
  expect(screen.getByRole('menuitemradio', { name: 'account.preferences.themeLight' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
});

test('filters privileged actions while retaining universal help and preferences', () => {
  render(<Harness capabilities={{ expense: true, member: false, fundingRound: false, settlement: false, support: true, account: false }} />);
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.quickActions' }));
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsExpense' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsMember' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsFundingRound' })).not.toBeInTheDocument();

  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsSettlement' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'dashboard.quickActionsAccount' })).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'dashboard.quickActionsSupport' })).toBeInTheDocument();
});

test('theme and language choices dispatch through the canonical preference controls', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.quickActions' }));
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'account.preferences.themeDark' }));
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'العربية' }));
  expect(mockChangeTheme).toHaveBeenCalledWith('dark');
  expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
});

test('Escape closes the menu and returns focus to its launcher', () => {
  render(<Harness />);
  const launcher = screen.getByRole('button', { name: 'dashboard.quickActions' });
  fireEvent.click(launcher);
  expect(screen.getByRole('menu')).toBeInTheDocument();

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(launcher).toHaveFocus();
});

test('uses Material Symbols dropdown actions without direction-specific duplicate markup', () => {
  document.documentElement.dir = 'rtl';
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.quickActions' }));
  expect(screen.getByText('receipt_long')).toHaveClass('material-symbols-outlined');
  expect(screen.getByText('person_add')).toHaveClass('material-symbols-outlined');
  expect(screen.getByText('savings')).toHaveClass('material-symbols-outlined');
  expect(screen.getAllByRole('menu')).toHaveLength(1);
  document.documentElement.dir = 'ltr';
});
