import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ExpenseForm, { toCents } from './ExpenseForm';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const members = [
  { id: 'a', display_name: 'Fahad', avatar_key: 'avatar_01' },
  { id: 'b', display_name: 'Saud', avatar_key: 'avatar_02' },
];

test('builds an exact split with multiple participant values', () => {
  const onSubmit = jest.fn();
  render(<ExpenseForm members={members} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText('expense.description'), { target: { value: 'Dinner' } });
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '100.00' } });
  fireEvent.change(screen.getByLabelText('Fahad expense.paidAmount'), { target: { value: '100.00' } });
  fireEvent.change(screen.getByLabelText('expense.splitMethod'), { target: { value: 'exact' } });
  fireEvent.change(screen.getByLabelText('Fahad split.exact'), { target: { value: '70' } });
  fireEvent.change(screen.getByLabelText('Saud split.exact'), { target: { value: '30' } });
  fireEvent.click(screen.getByText('expense.add'));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ split_type: 'exact', payments: [{ member_id: 'a', amount: '100.00' }], shares: [{ member_id: 'a', amount: '70' }, { member_id: 'b', amount: '30' }] }));
});

test('percentage submit remains disabled until assigned total is 100', () => {
  render(<ExpenseForm members={members} onSubmit={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Fahad expense.paidAmount'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('expense.splitMethod'), { target: { value: 'percentage' } });
  fireEvent.change(screen.getByLabelText('Fahad split.percentage'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Saud split.percentage'), { target: { value: '30' } });
  expect(screen.getByText('expense.add')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Saud split.percentage'), { target: { value: '40' } });
  expect(screen.getByText('expense.add')).not.toBeDisabled();
});

test('converts decimal assistance values to minor units', () => {
  expect(toCents('10.25')).toBe(1025);
});

test('personal expense hides split controls and submits explicit scope', () => {
  const onSubmit = jest.fn();
  render(<ExpenseForm members={members} currentMember={members[0]} categories={[{ id: 'food', code: 'food', name: 'Food' }]} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByLabelText('expense.scope.personal'));
  fireEvent.change(screen.getByLabelText('expense.description'), { target: { value: 'Coffee' } });
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '12.00' } });
  expect(screen.queryByText('expense.payers')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('expense.add'));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scope: 'personal', amount: '12.00', category: 'food' }));
});
