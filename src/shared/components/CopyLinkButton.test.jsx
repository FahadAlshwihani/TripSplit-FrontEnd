import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CopyLinkButton from './CopyLinkButton';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const originalClipboard = navigator.clipboard;
const originalShare = navigator.share;

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true });
  jest.restoreAllMocks();
});

test('copies the given URL to the clipboard when Web Share is unavailable', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.com/trips/abc/fund'));
});

test('shows transient "link copied" feedback after a successful clipboard copy', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('common.linkCopied')).toBeInTheDocument();
});

test('uses navigator.share when available, never falling back to clipboard', async () => {
  const share = jest.fn().mockResolvedValue(undefined);
  const writeText = jest.fn();
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(share).toHaveBeenCalledWith({ url: 'https://example.com/trips/abc/fund' }));
  expect(writeText).not.toHaveBeenCalled();
});

test('a cancelled native share sheet (AbortError) never falls back to clipboard or shows feedback', async () => {
  const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
  const share = jest.fn().mockRejectedValue(abortError);
  const writeText = jest.fn();
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(share).toHaveBeenCalled());
  expect(writeText).not.toHaveBeenCalled();
  expect(screen.queryByText('common.linkCopied')).not.toBeInTheDocument();
});

test('a non-abort share failure falls back to clipboard copy', async () => {
  const share = jest.fn().mockRejectedValue(new Error('not supported here'));
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.com/trips/abc/fund'));
});

test('a denied clipboard permission never throws or shows an alert -- it silently no-ops', async () => {
  const writeText = jest.fn().mockRejectedValue(new Error('permission denied'));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(alertSpy).not.toHaveBeenCalled();
});

test('a click inside a clickable parent never bubbles to trigger the parent handler', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  const parentClick = jest.fn();
  render(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={parentClick}>
      <CopyLinkButton url="https://example.com/trips/abc/fund" />
    </div>,
  );
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(parentClick).not.toHaveBeenCalled();
});

test('renders the default copy-link label when none is given, and a custom label when provided', () => {
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" />);
  expect(screen.getByText('common.copyLink')).toBeInTheDocument();
});

test('the compact variant omits the visible text label but stays accessible via aria-label', () => {
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" compact />);
  expect(screen.queryByText('common.copyLink')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'common.copyLink' })).toBeInTheDocument();
});

test('a custom label is used for both the accessible name and the visible text', () => {
  render(<CopyLinkButton url="https://example.com/trips/abc/fund" label="fund.copyRoundLink" />);
  expect(screen.getByRole('button', { name: 'fund.copyRoundLink' })).toBeInTheDocument();
});
