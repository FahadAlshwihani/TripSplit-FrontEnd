import React from 'react';
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
  fireEvent.click(screen.getByRole('button', { name: 'trip.joinCode.copy' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('ABCD1234'));
});

test('never labels a short code or invitation token because it accepts only the explicit joinCode prop', () => {
  const { container } = render(<JoinCodeCard />);
  expect(container).toBeEmptyDOMElement();
});

test('invite-only state explains that a code does not grant access', () => {
  render(<JoinCodeCard joinCode="ABCD1234" joinPolicy="invite_only" />);
  expect(screen.getByText('trip.joinCode.inviteOnlyHint')).toBeInTheDocument();
});
