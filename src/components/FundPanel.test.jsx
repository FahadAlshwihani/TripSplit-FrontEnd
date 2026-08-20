import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FundPanel from './FundPanel';

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
    accounting: { collected: '750.00', spent: '500.00', balance: '250.00', surplus: '250.00', deficit: '0.00' },
    rounds: [{ id: 'r1', sequence_number: 1, title: 'Initial', status: 'open', statistics: { collected: '750.00', target: '1000.00', percentage_collected: '75.00', members: [{ member_id: 'b', display_name: 'Saud', avatar_key: 'avatar_02', expected: '1000.00', paid: '750.00', remaining: '250.00' }] } }],
  };
  render(<FundPanel fund={fund} members={members} currentMember={members[1]} currency="SAR" disabled />);
  expect(screen.getByText('750.00 SAR')).toBeInTheDocument();
  expect(screen.getByText(/fund.expected 1000.00/)).toBeInTheDocument();
  expect(screen.queryByText('fund.recordContribution')).not.toBeInTheDocument();
});
