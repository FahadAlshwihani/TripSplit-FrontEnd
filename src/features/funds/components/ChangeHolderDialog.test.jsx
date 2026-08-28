import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ChangeHolderDialog from './ChangeHolderDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const members = [
  { id: 'm1', display_name: 'Fahad' },
  { id: 'm2', display_name: 'Saud' },
];

test('enters keyboard focus and closes on Escape', () => {
  const onClose = jest.fn();
  render(<ChangeHolderDialog holder={members[0]} activeMembers={members} onSave={jest.fn()} onClose={onClose} />);

  expect(screen.getByRole('button', { name: 'common.close' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});
