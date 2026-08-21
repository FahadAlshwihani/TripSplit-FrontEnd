import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../../i18n'; // real i18next singleton — bundled en/ar resources, not mocked
import i18n from '../../../i18n';
import HomePage from './HomePage';
import { ThemeProvider } from '../../../components/ThemeProvider';
import LanguageProvider from '../../../components/LanguageProvider';

beforeEach(async () => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('en');
});

const renderHome = () => render(<MemoryRouter><LanguageProvider><ThemeProvider><HomePage /></ThemeProvider></LanguageProvider></MemoryRouter>);
const clickByVisibleText = (text) => fireEvent.click(screen.getByText(text, { selector: 'button' }));

test('clicking AR renders real Arabic Home copy and switches direction to RTL', () => {
  renderHome();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Travel money, without the group-chat math.');
  clickByVisibleText('AR');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('فلوس السفر، من غير حسابات الجروب المعقّدة.');
  expect(document.documentElement.dir).toBe('rtl');
  expect(document.documentElement.lang).toBe('ar');
});

test('clicking EN restores English copy and LTR direction', async () => {
  renderHome();
  clickByVisibleText('AR');
  clickByVisibleText('EN');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Travel money, without the group-chat math.');
  expect(document.documentElement.dir).toBe('ltr');
});

test('switching language does not navigate away or blank the page — the same route stays mounted', () => {
  renderHome();
  clickByVisibleText('AR');
  expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
  expect(document.querySelector('.neo-loading')).not.toBeInTheDocument();
  const createLink = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/create-trip');
  const joinLink = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/join-trip');
  expect(createLink).toBeTruthy();
  expect(joinLink).toBeTruthy();
});

test('the selected language persists to localStorage and is restored on the next mount', () => {
  const { unmount } = renderHome();
  clickByVisibleText('AR');
  expect(window.localStorage.getItem('tripsplit:language')).toBe('ar');
  unmount();
  renderHome();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('فلوس السفر، من غير حسابات الجروب المعقّدة.');
  expect(document.documentElement.dir).toBe('rtl');
});

test('theme and language preferences are independent of each other', () => {
  renderHome();
  fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
  clickByVisibleText('AR');
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(document.documentElement.dir).toBe('rtl');
  clickByVisibleText('EN');
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(document.documentElement.dir).toBe('ltr');
});

test('desktop nav places Sign In before the language/theme utility controls', () => {
  renderHome();
  const links = document.querySelector('.public-nav__links');
  const order = Array.from(links.children).map((el) =>
    el.classList.contains('public-nav__link--signin') ? 'signin'
      : el.classList.contains('public-nav__utilities') ? 'utilities'
        : null
  ).filter(Boolean);
  expect(order).toEqual(['signin', 'utilities']);
});
