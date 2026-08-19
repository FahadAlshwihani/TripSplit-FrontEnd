import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuickExpense from './QuickExpense';
import CategoryManager from './CategoryManager';
import MemberDetail from './MemberDetail';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
const members = [{ id: 'me', display_name: 'Me', avatar_key: 'avatar_01' }, { id: 'friend', display_name: 'Friend', avatar_key: 'avatar_02' }];
const categories = [{ id: 'food-id', code: 'food', name: 'Food', icon_key: 'food', is_default: true }];

test('quick expense submits canonical equal split defaults', () => {
  const onSubmit = jest.fn();
  render(<QuickExpense currentMember={members[0]} members={members} categories={categories} onSubmit={onSubmit} onMore={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '40.00' } });
  fireEvent.change(screen.getByLabelText('expense.description'), { target: { value: 'Lunch' } });
  fireEvent.click(screen.getByText('quick.save'));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scope: 'shared', split_type: 'equal', payments: [{ member_id: 'me', amount: '40.00' }], participant_ids: ['me', 'friend'] }));
});

test('category manager renders over-budget usage and edit controls', () => {
  render(<CategoryManager categories={categories} budgets={[{ category: 'food', budget: '100.00', spent: '125.00', remaining: '-25.00', usage_percentage: '125.00' }]} budgetSummary={{ trip_budget: '500', allocated: '100', unallocated: '400' }} currency="SAR" canManage onCreate={jest.fn()} />);
  expect(screen.getByText(/125.00 \/ 100.00 SAR/)).toBeInTheDocument();
  expect(screen.getByText('categories.over')).toBeInTheDocument();
  expect(screen.getByText('categories.reset')).toBeInTheDocument();
});

test('member detail renders privacy-safe aggregate statistics', () => {
  const detail = { member: { display_name: 'Fahad', avatar_key: 'avatar_01', role: 'member', identity_type: 'guest', active: true, joined_at: '2026-08-01' }, statistics: { total_paid: '100', total_expense_share: '70', total_personal_spending: '20', settlements_sent: '0', settlements_received: '10', current_balance: '20', expense_count: 2, last_activity_at: '2026-08-19' } };
  render(<MemberDetail detail={detail} currency="SAR" onClose={jest.fn()} />);
  expect(screen.getByText(/Fahad/)).toBeInTheDocument();
  expect(screen.getAllByText('20 SAR').length).toBeGreaterThan(0);
  expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
});
