/*
  Pure presentation derivations for one expense row -- counting/branching
  over data the server already sent (payment_source, the payments/shares
  arrays, scope, split_type), never computing a new financial figure.
  The expense list response already carries the full payments/shares
  breakdown per row (no separate detail fetch needed), so both the
  ledger row and the details dialog read from the exact same object.
*/

// { type: 'trip_fund' } | { type: 'single', member } | { type: 'multiple', count }
// A payer id not present in `membersById` (a former member who has
// since left the trip) resolves to `member: null` -- callers must
// render a safe fallback, never assume the lookup always succeeds.
export const paymentSummary = (expense, membersById) => {
  if (expense.payment_source === 'trip_fund') return { type: 'trip_fund' };
  const count = expense.payments.length;
  if (count === 1) return { type: 'single', member: membersById[expense.payments[0].member_id] || null };
  return { type: 'multiple', count };
};

// { scope: 'personal' } | { scope: 'shared', splitType, participantCount }
export const splitSummary = (expense) => {
  if (expense.scope === 'personal') return { scope: 'personal' };
  return { scope: 'shared', splitType: expense.split_type, participantCount: expense.shares.length };
};

export const membersById = (members) => Object.fromEntries(members.map((member) => [member.id, member]));
