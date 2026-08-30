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

test('cannot submit more than the selected candidate\'s remaining reimbursable amount', () => {
  const onSave = jest.fn();
  const Dialog = ReimbursementSection.Dialog;
  const member = { id: 'm1', display_name: 'Fahad' };
  const candidate = { member_id: 'm1', display_name: 'Fahad', suggested_amount: '150.00' };
  render(<Dialog candidates={[candidate]} members={[member]} currency="SAR" onSave={onSave} onClose={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /Fahad/ }));
  const submit = screen.getByRole('button', { name: 'fund.reimburseAction' });
  expect(submit).not.toBeDisabled();

  fireEvent.change(screen.getByLabelText('fund.amount'), { target: { value: '151' } });
  expect(screen.getByText('fund.errors.exceedsReimbursable')).toBeInTheDocument();
  expect(submit).toBeDisabled();

  fireEvent.change(screen.getByLabelText('fund.amount'), { target: { value: '150' } });
  expect(screen.queryByText('fund.errors.exceedsReimbursable')).not.toBeInTheDocument();
  expect(submit).not.toBeDisabled();
  fireEvent.click(submit);
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ member_id: 'm1', amount: '150' }));
});
