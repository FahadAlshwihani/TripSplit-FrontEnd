import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicNav from './PublicNav';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

let mockAuth = { isAuthenticated: false, authLoading: false, user: null };
jest.mock('../../auth/AuthContext', () => ({ useAuth: () => mockAuth }));

const renderNav = () => render(<MemoryRouter><PublicNav /></MemoryRouter>);

beforeEach(() => {
  mockAuth = { isAuthenticated: false, authLoading: false, user: null };
});

test('an anonymous visitor sees Sign In and the standalone theme/language utilities', () => {
  renderNav();
  expect(screen.getByRole('link', { name: 'home.nav.signIn' })).toHaveAttribute('href', '/auth');
  expect(screen.getByRole('group', { name: 'language.groupLabel' })).toBeInTheDocument();
});

test('an authenticated visitor never sees a Dashboard link', () => {
  mockAuth = { isAuthenticated: true, authLoading: false, user: { display_name: 'Fahad', email: 'fahad@example.com', avatar_type: 'legacy', avatar_key: 'avatar_01' } };
  renderNav();
  expect(screen.queryByText('home.nav.dashboard')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
});

test('an authenticated visitor sees their own display name and avatar instead of Sign In', () => {
  mockAuth = { isAuthenticated: true, authLoading: false, user: { display_name: 'Fahad', email: 'fahad@example.com', avatar_type: 'legacy', avatar_key: 'avatar_01' } };
  renderNav();
  expect(screen.queryByRole('link', { name: 'home.nav.signIn' })).not.toBeInTheDocument();
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Fahad/ })).toBeInTheDocument();
});

test('while auth is still restoring, neither Sign In nor the account menu is shown', () => {
  mockAuth = { isAuthenticated: false, authLoading: true, user: null };
  renderNav();
  expect(screen.queryByRole('link', { name: 'home.nav.signIn' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /account/i })).not.toBeInTheDocument();
});
