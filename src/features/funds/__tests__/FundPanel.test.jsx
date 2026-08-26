import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FundPanel from '../components/FundPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const members = [
  { id: 'a', display_name: 'Fahad', avatar_key: 'avatar_01', role: 'owner', active: true },
  { id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', role: 'member', active: true },
];

test('owner can create a trip fund from the empty state', () => {
  const onCreate = jest.fn();
  render(<FundPanel members={members} currentMember={members[0]} currency="SAR" onCreate={onCreate} />);
  fireEvent.click(screen.getByText('fund.create'));
  expect(onCreate).toHaveBeenCalledWith({ name: 'fund.title', holder_id: 'a' });
});

test('renders authoritative fund and contribution statistics', () => {
  const fund = {
    name: 'Trip Fund', holder: members[0], status: 'active',
    accounting: { collected: '750.00', spent: '500.00', refunded: '0.00', balance: '250.00', surplus: '250.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'open', statistics: { collected: '750.00', target: '1000.00', percentage_collected: '75.00', members: [{ member_id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', expected: '1000.00', paid: '750.00', remaining: '250.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[1]} currency="SAR" disabled />);
  expect(screen.getByText('750.00 SAR')).toBeInTheDocument();
  expect(screen.getByText(/fund.expected 1000.00/)).toBeInTheDocument();
  expect(screen.queryByText('fund.recordContribution')).not.toBeInTheDocument();
});

test('custom refund builds an allocation preview before confirmation', async () => {
  const onPreviewRefund = jest.fn().mockResolvedValue({ distribution_amount: '100.00', remaining_balance: '150.00', allocations: [{ member_id: 'a', display_name: 'Fahad', refund_amount: '60.00' }, { member_id: 'b', display_name: 'Saud', refund_amount: '40.00' }] });
  const fund = {
    name: 'Trip Fund', holder: members[0], status: 'active', contributions: [], refunds: [],
    accounting: { collected: '250.00', spent: '0.00', refunded: '0.00', balance: '250.00', surplus: '250.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'completed', statistics: { collected: '250.00', target: '250.00', remaining: '0.00', percentage_collected: '100.00', members: [{ member_id: 'a', display_name: 'Fahad', expected: '150.00', paid: '150.00', remaining: '0.00', overpaid: '0.00' }, { member_id: 'b', display_name: 'Saud', expected: '100.00', paid: '100.00', remaining: '0.00', overpaid: '0.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[0]} currency="SAR" onPreviewRefund={onPreviewRefund} />);
  fireEvent.change(screen.getByLabelText('fund.refundMethod'), { target: { value: 'custom' } });
  fireEvent.change(screen.getByLabelText('fund.distributionAmount'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Fahad fund.refund'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Saud fund.refund'), { target: { value: '40' } });
  fireEvent.click(screen.getByText('fund.preview'));
  await waitFor(() => expect(onPreviewRefund).toHaveBeenCalledWith(expect.objectContaining({ method: 'custom', distribution_amount: '100', custom: [{ member_id: 'a', amount: '60' }, { member_id: 'b', amount: '40' }] })));
  expect(await screen.findByText('Fahad: 60.00 SAR')).toBeInTheDocument();
});

test('a manager sees a Remind action on a member who still owes the round, and it calls onRemind with the round and member', async () => {
  const onRemind = jest.fn().mockResolvedValue({ member_id: 'b', amount: '250.00', notified: true });
  const fund = {
    name: 'Trip Fund', holder: members[0], status: 'active',
    accounting: { collected: '750.00', spent: '500.00', refunded: '0.00', balance: '250.00', surplus: '250.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'open', statistics: { collected: '750.00', target: '1000.00', percentage_collected: '75.00', members: [{ member_id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', expected: '1000.00', paid: '750.00', remaining: '250.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[0]} currency="SAR" onRemind={onRemind} />);
  fireEvent.click(screen.getByRole('button', { name: 'fund.remind' }));
  await waitFor(() => expect(onRemind).toHaveBeenCalledWith(fund.rounds[0], 'b'));
  expect(await screen.findByText('fund.reminderSent')).toBeInTheDocument();
});

test('a member who owes nothing more in the round gets no Remind action', () => {
  const fund = {
    name: 'Trip Fund', holder: members[0], status: 'active',
    accounting: { collected: '1000.00', spent: '500.00', refunded: '0.00', balance: '500.00', surplus: '500.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'open', statistics: { collected: '1000.00', target: '1000.00', percentage_collected: '100.00', members: [{ member_id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', expected: '1000.00', paid: '1000.00', remaining: '0.00', overpaid: '0.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[0]} currency="SAR" onRemind={jest.fn()} />);
  expect(screen.queryByRole('button', { name: 'fund.remind' })).not.toBeInTheDocument();
});

test('a non-manager (disabled) never sees the Remind action, even on a member who owes the round', () => {
  const fund = {
    name: 'Trip Fund', holder: members[0], status: 'active',
    accounting: { collected: '750.00', spent: '500.00', refunded: '0.00', balance: '250.00', surplus: '250.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'open', statistics: { collected: '750.00', target: '1000.00', percentage_collected: '75.00', members: [{ member_id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', expected: '1000.00', paid: '750.00', remaining: '250.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[1]} currency="SAR" disabled onRemind={jest.fn()} />);
  expect(screen.queryByRole('button', { name: 'fund.remind' })).not.toBeInTheDocument();
});

test('contribution correction requires a reason and submits the replacement amount', () => {
  const onCorrectContribution = jest.fn();
  const fund = { name: 'Trip Fund', holder: members[0], status: 'active', refunds: [], accounting: { collected: '1000.00', spent: '1000.00', refunded: '0.00', balance: '0.00', surplus: '0.00', deficit: '0.00' }, rounds: [], contributions: [{ id: 'c1', round_id: 'r1', round_title: 'Initial', member_id: 'b', display_name: 'Saud', amount: '1000.00', contribution_date: '2026-08-20', voided: false }] };
  render(<FundPanel fund={fund} members={members} currentMember={members[0]} currency="SAR" onCorrectContribution={onCorrectContribution} />);
  fireEvent.click(screen.getByText('fund.correct'));
  fireEvent.change(screen.getByLabelText('fund.correctAmount'), { target: { value: '750' } });
  fireEvent.change(screen.getByLabelText('fund.correctionReason'), { target: { value: 'Bank receipt' } });
  fireEvent.click(screen.getByText('common.save'));
  expect(onCorrectContribution).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }), { amount: '750', reason: 'Bank receipt' });
});
