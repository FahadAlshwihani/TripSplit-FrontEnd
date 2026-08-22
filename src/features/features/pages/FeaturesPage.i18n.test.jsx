import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../../i18n'; // real i18next singleton — bundled en/ar resources, not mocked
import i18n from '../../../i18n';
import FeaturesPage from './FeaturesPage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import LanguageProvider from '../../../components/LanguageProvider';

beforeEach(async () => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('en');
});

const renderFeatures = () => render(<MemoryRouter><LanguageProvider><ThemeProvider><FeaturesPage /></ThemeProvider></LanguageProvider></MemoryRouter>);

test('renders real English features copy', () => {
  renderFeatures();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Editorial Ledger');
  expect(screen.getByText('The Split Engine')).toBeInTheDocument();
  expect(screen.getByText('Direct Bank Links')).toBeInTheDocument();
  expect(screen.getByText('Coming soon')).toBeInTheDocument();
});

test('renders real Arabic features copy and switches direction to RTL', async () => {
  await i18n.changeLanguage('ar');
  renderFeatures();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('الدفتر التحريري');
  expect(screen.getByText('محرك التقسيم')).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');
});
