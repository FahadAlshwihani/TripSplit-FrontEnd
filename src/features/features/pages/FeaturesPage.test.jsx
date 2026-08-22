import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeaturesPage from './FeaturesPage';
import { ThemeProvider } from '../../../components/ThemeProvider';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

const renderFeatures = () => render(<MemoryRouter><ThemeProvider><FeaturesPage /></ThemeProvider></MemoryRouter>);

test('renders the page title as the page h1', () => {
  renderFeatures();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('features.title');
});

test('renders both numbered section titles', () => {
  renderFeatures();
  expect(screen.getByRole('heading', { level: 2, name: 'features.section1.title' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'features.section2.title' })).toBeInTheDocument();
});

test('renders the split-engine mini feature list', () => {
  renderFeatures();
  expect(screen.getByText('features.section1.items.exactSplits.title')).toBeInTheDocument();
  expect(screen.getByText('features.section1.items.multiCurrency.title')).toBeInTheDocument();
});

test('renders the Direct Bank Links card with its coming-soon indicator', () => {
  renderFeatures();
  expect(screen.getByRole('heading', { level: 3, name: 'features.section2.cards.bank.title' })).toBeInTheDocument();
  expect(screen.getByText('features.section2.cards.bank.soon')).toBeInTheDocument();
});

test('does not mark the live Debt Minimization card as coming soon', () => {
  renderFeatures();
  const debtCard = screen.getByRole('heading', { level: 3, name: 'features.section2.cards.debt.title' }).closest('.capability-card');
  expect(debtCard).not.toHaveClass('capability-card--soon');
});

test('uses the shared public layout: nav and footer both present', () => {
  renderFeatures();
  expect(document.querySelector('.public-nav')).toBeInTheDocument();
  expect(document.querySelector('.public-footer')).toBeInTheDocument();
  expect(screen.getAllByText('home.nav.brand').length).toBeGreaterThanOrEqual(2);
});

test('theme and language controls remain present on the features page', () => {
  renderFeatures();
  expect(screen.getByRole('button', { name: 'language.switchToArabic' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'theme.switchToDark' })).toBeInTheDocument();
});
