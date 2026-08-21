import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

const Probe = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <p>current: {theme}</p>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme('light')}>force light</button>
    </div>
  );
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('defaults to light when there is no saved preference', () => {
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('current: light')).toBeInTheDocument();
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});

test('toggling to dark applies data-theme="dark" and persists it', () => {
  render(<ThemeProvider><Probe /></ThemeProvider>);
  fireEvent.click(screen.getByText('toggle'));
  expect(screen.getByText('current: dark')).toBeInTheDocument();
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(window.localStorage.getItem('tripsplit:theme')).toBe('dark');
});

test('a saved dark preference is restored on next mount', () => {
  window.localStorage.setItem('tripsplit:theme', 'dark');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('current: dark')).toBeInTheDocument();
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});

test('switching back to light persists and restores light', () => {
  window.localStorage.setItem('tripsplit:theme', 'dark');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  fireEvent.click(screen.getByText('force light'));
  expect(screen.getByText('current: light')).toBeInTheDocument();
  expect(window.localStorage.getItem('tripsplit:theme')).toBe('light');
});

test('an unrecognized stored value falls back to light rather than crashing', () => {
  window.localStorage.setItem('tripsplit:theme', 'sepia');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('current: light')).toBeInTheDocument();
});
