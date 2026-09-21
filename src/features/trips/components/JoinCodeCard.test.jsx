import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JoinCodeCard from './JoinCodeCard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('renders and copies the canonical code as an explicit LTR value', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<JoinCodeCard joinCode="ABCD1234" />);
  const code = screen.getByText('ABCD1234');
  expect(code.tagName).toBe('BDI');
  expect(code).toHaveAttribute('dir', 'ltr');
  const copyButton = screen.getByRole('button', { name: 'trip.joinCode.copy' });
  expect(copyButton).toHaveClass('pressable-sm');
  fireEvent.click(copyButton);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('ABCD1234'));
});

test('shared styling balances field and button height with an inset field and mobile stacking', () => {
  const css = readFileSync(path.join(__dirname, 'JoinCodeCard.css'), 'utf8');
  expect(css).toMatch(/\.join-code-card__value\s*\{[^}]*min-height:\s*48px;[^}]*box-shadow:\s*inset 2px 2px 0 var\(--color-border-subtle\)/s);
  expect(css).toMatch(/\.join-code-card__button\s*\{[^}]*min-height:\s*48px/s);
  expect(css).toMatch(/@media \(max-width:\s*430px\)[^}]*flex-direction:\s*column/s);
});

test('never labels a short code or invitation token because it accepts only the explicit joinCode prop', () => {
  const { container } = render(<JoinCodeCard />);
  expect(container).toBeEmptyDOMElement();
});

test('invite-only state explains that a code does not grant access', () => {
  render(<JoinCodeCard joinCode="ABCD1234" joinPolicy="invite_only" />);
  expect(screen.getByText('trip.joinCode.inviteOnlyHint')).toBeInTheDocument();
});
