import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountMenu from './AccountMenu';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

const user = { display_name: 'Fahad', email: 'fahad@example.com', preferred_theme: 'light', preferred_language: 'en', avatar_type: 'initials', avatar_color: 'indigo' };
const mockSaveProfile = jest.fn();
const mockLogout = jest.fn();
jest.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user, saveProfile: mockSaveProfile, logout: mockLogout }) }));

const mockSetTheme = jest.fn();
jest.mock('../../components/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }) }));

const renderMenu = () => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<AccountMenu />} />
      <Route path="/account" element={<p>account page</p>} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  mockSaveProfile.mockReset().mockResolvedValue(user);
  mockLogout.mockReset().mockResolvedValue();
  mockSetTheme.mockReset();
});

test('the trigger shows the avatar and display name, collapsed by default', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: /Fahad/ });
  expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('fahad@example.com')).not.toBeInTheDocument();
});

test('clicking the trigger opens the panel with identity, My Account, Theme, Language, and Log Out', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  expect(screen.getByText('account.pageTitle')).toBeInTheDocument();
  expect(screen.getByText('account.preferences.themeLight')).toBeInTheDocument();
  expect(screen.getByText('account.preferences.themeDark')).toBeInTheDocument();
  expect(screen.getByText('common.logOut')).toBeInTheDocument();
});

test('My Account navigates to /account', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  fireEvent.click(screen.getByText('account.pageTitle'));
  expect(screen.getByText('account page')).toBeInTheDocument();
});

test('choosing Dark calls the canonical preference save with preferred_theme, and applies it locally', async () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  fireEvent.click(screen.getByText('account.preferences.themeDark'));
  expect(mockSetTheme).toHaveBeenCalledWith('dark');
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ preferred_theme: 'dark' }));
});

test('choosing Arabic calls the canonical preference save with preferred_language', async () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  fireEvent.click(screen.getByText('AR'));
  await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith({ preferred_language: 'ar' }));
});

test('Log Out invalidates the session and returns to Home', async () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  await act(async () => {
    fireEvent.click(screen.getByText('common.logOut'));
  });
  expect(mockLogout).toHaveBeenCalled();
});

test('Escape closes the panel and returns focus to the trigger', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: /Fahad/ });
  fireEvent.click(trigger);
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByText('fahad@example.com')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('clicking outside the panel closes it', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  fireEvent.mouseDown(document.body);
  expect(screen.queryByText('fahad@example.com')).not.toBeInTheDocument();
});

test('the display name uses the dedicated contrast-hardened identity class, not a bare/inherited color', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  expect(screen.getByText('fahad@example.com')).toHaveClass('account-menu__identity-email');
  const nameNodes = screen.getAllByText('Fahad');
  expect(nameNodes.some((node) => node.classList.contains('account-menu__identity-name'))).toBe(true);
});

test('the Theme and Language segmented controls share the same layout class (equal shared width)', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  const themeControl = screen.getByRole('group', { name: 'account.preferences.theme' });
  const languageControl = screen.getByRole('group', { name: 'account.preferences.language' });
  expect(themeControl).toHaveClass('account-menu__toggle');
  expect(languageControl).toHaveClass('account-menu__toggle');
});

test('Theme and Language stay segmented option rows (not generic menu items), and the current selection is marked active', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  const themeControl = screen.getByRole('group', { name: 'account.preferences.theme' });
  const options = within(themeControl).getAllByRole('button');
  expect(options).toHaveLength(2);
  options.forEach((option) => expect(option).toHaveClass('account-menu__toggle-option'));
  expect(screen.getByText('account.preferences.themeLight').closest('button')).toHaveClass('is-active');
});

test('My Account / Log Out remain real menu-item rows, distinct from the segmented Theme/Language controls', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  expect(screen.getByText('account.pageTitle').closest('button')).toHaveClass('account-menu__item');
  expect(screen.getByText('common.logOut').closest('button')).toHaveClass('account-menu__item');
});

test('never shows a Dashboard action', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
});
