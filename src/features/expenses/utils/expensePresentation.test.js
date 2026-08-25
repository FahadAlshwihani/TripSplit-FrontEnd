import { membersById, paymentSummary, splitSummary } from './expensePresentation';

const members = [
  { id: 'm1', display_name: 'Fahad' },
  { id: 'm2', display_name: 'Saud' },
];
const lookup = membersById(members);

test('membersById indexes members by id for O(1) lookup', () => {
  expect(lookup.m1.display_name).toBe('Fahad');
  expect(lookup.m2.display_name).toBe('Saud');
});

test('paymentSummary reports trip_fund without needing a payer lookup', () => {
  const expense = { payment_source: 'trip_fund', payments: [] };
  expect(paymentSummary(expense, lookup)).toEqual({ type: 'trip_fund' });
});

test('paymentSummary resolves a single payer to their member object', () => {
  const expense = { payment_source: 'personal', payments: [{ member_id: 'm1', amount: '100.00' }] };
  expect(paymentSummary(expense, lookup)).toEqual({ type: 'single', member: lookup.m1 });
});

test('paymentSummary never lies about a multi-payer expense as a single payer', () => {
  const expense = { payment_source: 'personal', payments: [{ member_id: 'm1', amount: '50.00' }, { member_id: 'm2', amount: '50.00' }] };
  expect(paymentSummary(expense, lookup)).toEqual({ type: 'multiple', count: 2 });
});

test('paymentSummary falls back to a null member for a payer no longer in the trip, never crashes', () => {
  const expense = { payment_source: 'personal', payments: [{ member_id: 'gone', amount: '100.00' }] };
  expect(paymentSummary(expense, lookup)).toEqual({ type: 'single', member: null });
});

test('splitSummary reports personal scope without a split type/participant count', () => {
  expect(splitSummary({ scope: 'personal', split_type: 'equal', shares: [] })).toEqual({ scope: 'personal' });
});

test('splitSummary reports the real split_type and participant count for shared expenses', () => {
  const expense = { scope: 'shared', split_type: 'percentage', shares: [{ member_id: 'm1' }, { member_id: 'm2' }] };
  expect(splitSummary(expense)).toEqual({ scope: 'shared', splitType: 'percentage', participantCount: 2 });
});
