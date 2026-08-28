import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ReimbursementSection from './ReimbursementSection';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('Escape closes the reimbursement dialog', () => {
  const onClose = jest.fn();
  const Dialog = ReimbursementSection.Dialog;
  render(<Dialog candidates={[]} members={[]} currency="SAR" onSave={jest.fn()} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});
