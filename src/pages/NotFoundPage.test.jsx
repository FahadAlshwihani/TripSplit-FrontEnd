import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: null, authLoading: false, logout: jest.fn() }) }));

test('renders a branded semantic 404 with useful public exits', () => {
  render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('notFound.title');
  expect(screen.getByRole('link', { name: 'notFound.home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'notFound.features' })).toHaveAttribute('href', '/features');
  expect(document.querySelector('canvas')).not.toBeInTheDocument();
});
