import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import CategoryManager from '../components/CategoryManager';
import MemberDetail from '../../members/components/MemberDetail';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));
const categories = [{ id: 'food-id', code: 'food', name: 'Food', icon_key: 'food', is_default: true }];

test('category manager renders over-budget usage and edit controls', () => {
  render(<CategoryManager categories={categories} budgets={[{ category: 'food', budget: '100.00', spent: '125.00', remaining: '-25.00', usage_percentage: '125.00' }]} budgetSummary={{ trip_budget: '500', allocated: '100', unallocated: '400' }} currency="SAR" canManage onCreate={jest.fn()} />);
  expect(screen.getByText(/125.00 \/ 100.00 SAR/)).toBeInTheDocument();
  expect(screen.getByText('categories.over')).toBeInTheDocument();
  expect(screen.getByText('categories.reset')).toBeInTheDocument();
});

test('member detail renders privacy-safe aggregate statistics', () => {
  const detail = { member: { display_name: 'Fahad', avatar_key: 'avatar_01', role: 'member', identity_type: 'guest', active: true, joined_at: '2026-08-01', capabilities: { can_settle_with: false } }, statistics: { total_paid: '100', total_expense_share: '70', total_personal_spending: '20', settlements_sent: '0', settlements_received: '10', current_balance: '20', expense_count: 2, last_activity_at: '2026-08-19' } };
  render(<MemoryRouter><MemberDetail detail={detail} currency="SAR" tripId="trip-1" onClose={jest.fn()} /></MemoryRouter>);
  expect(screen.getByText(/Fahad/)).toBeInTheDocument();
  const moneyMatcher = (text) => (_content, node) => (
    node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
  );
  expect(screen.getAllByText(moneyMatcher('20.00 SAR')).length).toBeGreaterThan(0);
  expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
});
