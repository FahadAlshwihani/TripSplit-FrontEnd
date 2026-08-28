import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ContributionActionDialog from './ContributionActionDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const member = { id: 'm1', display_name: 'Fahad' };
const round = { title: 'Initial', statistics: { members: [{ member_id: 'm1', expected: '100.00', paid: '0.00', remaining: '100.00' }] } };

test('contribution dialog closes on Escape and starts focus inside', () => {
  const onClose = jest.fn();
  render(<ContributionActionDialog mode="report" round={round} members={[member]} currentMember={member} currency="SAR" onSave={jest.fn()} onClose={onClose} />);

  expect(screen.getByRole('button', { name: 'common.close' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});
