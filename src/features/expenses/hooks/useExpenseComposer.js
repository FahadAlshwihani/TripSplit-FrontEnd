import { useEffect, useMemo, useState } from 'react';

/*
  The full New/Edit Expense state machine -- ported from the previous
  ExpenseForm.jsx (payment/split accounting, validation rules, payload
  construction) rather than rewritten, per "do not throw away working
  business logic": only the JSX/markup changed to the new sectioned
  Neo-classic composer, not the domain rules themselves. One canonical
  hook drives every combination the backend supports (shared/personal,
  trip-fund/member-funded, single/multi-payer, equal/exact/percentage/
  shares) -- no separate "quick" vs "full" state, matching "one
  canonical form/state machine must support all of these".
*/

export const toCents = (value) => Math.round(Number(value || 0) * 100);
const today = () => new Date().toISOString().slice(0, 10);

const initialState = (members, expense, currentMember, categories, tripCurrency) => {
  if (expense) {
    return {
      title: expense.title,
      amount: expense.original_amount || expense.amount,
      original_currency: expense.original_currency || tripCurrency,
      exchange_rate: expense.exchange_rate || '1',
      payment_source: expense.payment_source || 'personal',
      category: expense.category,
      scope: expense.scope || 'shared',
      expense_date: expense.expense_date,
      notes: expense.notes || '',
      split_type: expense.split_type,
      participant_ids: expense.shares.map((row) => row.member_id),
      payments: Object.fromEntries(expense.payments.map((row) => [row.member_id, row.amount])),
      splitValues: Object.fromEntries(expense.shares.map((row) => [row.member_id, row.percentage || row.weight || row.amount])),
    };
  }
  const payer = currentMember || members[0];
  return {
    title: '',
    amount: '',
    original_currency: tripCurrency,
    exchange_rate: '1',
    payment_source: 'personal',
    category: categories.find((item) => item.code === 'other')?.code || categories[0]?.code || 'other',
    scope: 'shared',
    expense_date: today(),
    notes: '',
    split_type: 'equal',
    participant_ids: members.map((member) => member.id),
    payments: payer ? { [payer.id]: '' } : {},
    splitValues: {},
  };
};

export default function useExpenseComposer({ members, categories, currentMember, tripCurrency, expense }) {
  const [form, setForm] = useState(() => initialState(members, expense, currentMember, categories, tripCurrency));

  useEffect(() => {
    setForm(initialState(members, expense, currentMember, categories, tripCurrency));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense, members, currentMember, categories, tripCurrency]);

  const isForeign = form.original_currency !== tripCurrency;
  const baseAmount = isForeign ? Number(form.amount || 0) * Number(form.exchange_rate || 0) : Number(form.amount || 0);

  // A lone payer always covers the full amount by definition -- there is
  // nothing to split between payers when there is only one, so the
  // composer never makes the user re-type the same number twice. Once a
  // second payer is added, explicit per-payer amounts become required
  // (see ExpenseComposerPayment, which only renders an amount input once
  // there are 2+ payers).
  const payerIds = Object.keys(form.payments);
  const paymentCents = useMemo(() => {
    if (payerIds.length === 1) return toCents(baseAmount);
    return payerIds.reduce((sum, id) => sum + toCents(form.payments[id]), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.payments, baseAmount]);
  const remainingPaymentCents = toCents(baseAmount) - paymentCents;

  const splitAssigned = useMemo(
    () => Object.values(form.splitValues).reduce((sum, value) => sum + Number(value || 0), 0),
    [form.splitValues],
  );

  const setField = (patch) => setForm((current) => ({ ...current, ...patch }));

  const setScope = (scope) => setForm((current) => ({
    ...current,
    scope,
    // A personal expense is always attributed to whoever is recording
    // it -- the backend forces this regardless of what's submitted
    // (see apps/expenses/serializers.py::ExpenseCreateSerializer.
    // validate), so the composer mirrors that here rather than
    // pretending a payer choice exists for personal expenses.
    payments: scope === 'personal' && currentMember ? { [currentMember.id]: current.amount } : current.payments,
  }));

  const togglePayer = (memberId) => setForm((current) => {
    const payments = { ...current.payments };
    if (memberId in payments) delete payments[memberId];
    else payments[memberId] = '';
    return { ...current, payments };
  });

  const setPayerAmount = (memberId, value) => setForm((current) => ({ ...current, payments: { ...current.payments, [memberId]: value } }));

  const toggleParticipant = (memberId) => setForm((current) => ({
    ...current,
    participant_ids: current.participant_ids.includes(memberId)
      ? current.participant_ids.filter((id) => id !== memberId)
      : [...current.participant_ids, memberId],
  }));

  const selectAllParticipants = () => setField({ participant_ids: members.map((member) => member.id) });
  const clearParticipants = () => setField({ participant_ids: [] });

  const setSplitValue = (memberId, value) => setForm((current) => ({ ...current, splitValues: { ...current.splitValues, [memberId]: value } }));

  const buildPayload = () => {
    const soloPayer = payerIds.length === 1;
    const payments = Object.entries(form.payments).map(([member_id, amount]) => ({
      member_id,
      amount: soloPayer ? baseAmount.toFixed(2) : amount,
    }));
    const payload = {
      title: form.title.trim(),
      amount: form.amount,
      original_currency: form.original_currency,
      exchange_rate: isForeign ? form.exchange_rate : '1',
      payment_source: form.payment_source,
      category: form.category,
      scope: form.scope,
      expense_date: form.expense_date,
      notes: form.notes,
      split_type: form.split_type,
      payments,
    };
    if (form.payment_source === 'trip_fund' || form.scope === 'personal') delete payload.payments;
    if (form.scope === 'shared') {
      if (form.split_type === 'equal') {
        payload.participant_ids = form.participant_ids;
      } else {
        const valueKey = form.split_type === 'exact' ? 'amount' : form.split_type === 'percentage' ? 'percentage' : 'weight';
        payload.shares = form.participant_ids.map((memberId) => ({ member_id: memberId, [valueKey]: form.splitValues[memberId] || '' }));
      }
    }
    return payload;
  };

  const errors = {};
  if (!form.title.trim()) errors.title = 'expenseComposer.errors.titleRequired';
  if (!form.category) errors.category = 'expenseComposer.errors.categoryRequired';
  if (!form.amount || Number(form.amount) <= 0) errors.amount = 'expenseComposer.errors.amountRequired';
  if (form.scope === 'shared') {
    if (!form.participant_ids.length) errors.participants = 'expenseComposer.errors.participantsRequired';
    if (form.payment_source === 'personal') {
      if (!Object.keys(form.payments).length) errors.payments = 'expenseComposer.errors.payerRequired';
      else if (remainingPaymentCents !== 0) errors.payments = 'expenseComposer.errors.paymentsMustTotal';
    }
    if (form.split_type === 'percentage' && splitAssigned !== 100) errors.split = 'expenseComposer.errors.percentageMustTotal100';
    if (form.split_type === 'exact' && toCents(splitAssigned) !== toCents(baseAmount)) errors.split = 'expenseComposer.errors.exactMustTotal';
  }
  const isValid = Object.keys(errors).length === 0;

  return {
    form,
    setField,
    setScope,
    togglePayer,
    setPayerAmount,
    toggleParticipant,
    selectAllParticipants,
    clearParticipants,
    setSplitValue,
    buildPayload,
    isForeign,
    baseAmount,
    remainingPaymentCents,
    splitAssigned,
    errors,
    isValid,
  };
}
