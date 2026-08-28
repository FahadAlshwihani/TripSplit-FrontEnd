import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ReimbursementSection from './ReimbursementSection';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('Escape closes the reimbursement dialog', () => {
  const onClose = jest.fn();
  const Dialog = ReimbursementSection.Dialog;
  render(<Dialog candidates={[]} members={[]} currency="SAR" onSave={jest.fn()} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('cannot dismiss while reimbursement submission is in flight', () => {
  const onClose = jest.fn();
  const onSave = jest.fn(() => new Promise(() => {}));
  const Dialog = ReimbursementSection.Dialog;
  const member = { id: 'm1', display_name: 'Fahad' };
  render(<Dialog candidates={[]} members={[member]} currency="SAR" onSave={onSave} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText('fund.member'), { target: { value: 'm1' } });
  fireEvent.change(screen.getByLabelText('fund.amount'), { target: { value: '50' } });
  fireEvent.click(screen.getByRole('button', { name: 'fund.reimburseAction' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'common.close' }));

  expect(onClose).not.toHaveBeenCalled();
});
