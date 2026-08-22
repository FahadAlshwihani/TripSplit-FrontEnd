import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../../i18n'; // real i18next singleton — bundled en/ar resources, not mocked
import i18n from '../../../i18n';
import PricingPage from './PricingPage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import LanguageProvider from '../../../components/LanguageProvider';

beforeEach(async () => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('en');
});

const renderPricing = () => render(<MemoryRouter><LanguageProvider><ThemeProvider><PricingPage /></ThemeProvider></LanguageProvider></MemoryRouter>);

test('renders real English pricing copy', () => {
  renderPricing();
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1).toHaveTextContent('One plan.');
  expect(h1).toHaveTextContent('Everything you need.');
  expect(screen.getByText('Forever free')).toBeInTheDocument();
  expect(screen.getByText('Unlimited trip creation')).toBeInTheDocument();
});

test('renders real Arabic pricing copy and switches direction to RTL', async () => {
  await i18n.changeLanguage('ar');
  renderPricing();
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1).toHaveTextContent('خطة واحدة.');
  expect(h1).toHaveTextContent('كل ما تحتاجه.');
  expect(screen.getByText('مجانية للأبد')).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');
});
