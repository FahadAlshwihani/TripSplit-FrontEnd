import { useEffect, useMemo, useRef, useState } from 'react';
import { getExchangeRate } from '../../currencies/api/currenciesApi';

/*
  The full New/Edit Expense state machine -- one canonical hook drives
  every combination the backend supports (shared/personal, trip-fund/
  member-funded, single/multi-payer, equal/exact/percentage/shares,
  same/foreign currency, create/edit/duplicate) plus the automatic
  exchange-rate flow: the composer never makes the user type a manual
  rate as the normal path -- it fetches one from the backend's FX
  preview endpoint and only falls back to manual entry as an explicit,
  user-chosen fallback (never shown by default).
*/

export const toCents = (value) => Math.round(Number(value || 0) * 100);
const today = () => new Date().toISOString().slice(0, 10);
const FX_DEBOUNCE_MS = 400;

const initialState = (members, expense, currentMember, categories, tripCurrency, hasFund) => {
  if (expense) {
    // A duplicate is a genuinely new financial event, not a continuation
    // of the original's FX snapshot -- it defaults to today (so the
    // usual "record it right now" duplicate flow gets a fresh rate for
    // today automatically) and is never treated as "pinned" (see the
    // fx.pinned handling below).
    const isDuplicate = Boolean(expense.duplicate);
    return {
      title: expense.title,
      amount: expense.original_amount || expense.amount,
      original_currency: expense.original_currency || tripCurrency,
      exchange_rate: expense.exchange_rate || '1',
      payment_source: expense.payment_source || 'personal',
      category: expense.category,
      scope: expense.scope || 'shared',
      expense_date: isDuplicate ? today() : expense.expense_date,
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
    // Prefer Trip Fund whenever this trip actually has one configured --
    // "smart default", never fabricated (falls back to member-paid when
    // there's no usable Fund).
    payment_source: hasFund ? 'trip_fund' : 'personal',
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

// Whether this session's rate should still be treated as an immutable,
// already-resolved historical snapshot (an existing expense's saved
// rate, untouched since load) versus one that needs a fresh resolution
// (new expense, duplicate, or the user just changed currency/date).
const initialPinned = (expense) => Boolean(expense) && !expense.duplicate;

export default function useExpenseComposer({ members, categories, currentMember, tripCurrency, expense, hasFund }) {
  const [form, setForm] = useState(() => initialState(members, expense, currentMember, categories, tripCurrency, hasFund));
  const [fx, setFx] = useState({ mode: 'auto', status: 'idle', rate: null, source: null, historical: false, errorMessage: null });
  const pinnedRef = useRef(initialPinned(expense));
  const fetchTokenRef = useRef(0);

  useEffect(() => {
    setForm(initialState(members, expense, currentMember, categories, tripCurrency, hasFund));
    pinnedRef.current = initialPinned(expense);
    setFx({ mode: 'auto', status: 'idle', rate: null, source: null, historical: false, errorMessage: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense, members, currentMember, categories, tripCurrency, hasFund]);

  const isForeign = form.original_currency !== tripCurrency;

  // Debounced auto-fetch, keyed only on currency/date (never amount --
  // changing the amount must never trigger another lookup, it just
  // recomputes the preview using whatever rate is already known).
  useEffect(() => {
    if (!isForeign || fx.mode === 'manual') return undefined;
    // An untouched historical snapshot (edit mode, currency/date still
    // exactly what was loaded) is already resolved -- never re-fetch it
    // just because the modal opened.
    if (pinnedRef.current) {
      setFx((current) => ({ ...current, status: 'ready', rate: form.exchange_rate, source: null, historical: false }));
      return undefined;
    }
    const token = ++fetchTokenRef.current;
    setFx((current) => ({ ...current, status: 'loading', errorMessage: null }));
    const handle = setTimeout(() => {
      getExchangeRate(form.original_currency, tripCurrency, form.expense_date)
        .then((data) => {
          if (fetchTokenRef.current !== token) return;
          setFx({ mode: 'auto', status: 'ready', rate: data.rate, source: data.source, historical: data.historical, errorMessage: null });
          setForm((current) => ({ ...current, exchange_rate: data.rate }));
        })
        .catch((error) => {
          if (fetchTokenRef.current !== token) return;
          setFx((current) => ({ ...current, status: 'error', errorMessage: error.response?.data?.message || null }));
        });
    }, FX_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeign, form.original_currency, form.expense_date, tripCurrency, fx.mode]);

  const useManualRate = () => { pinnedRef.current = false; setFx((current) => ({ ...current, mode: 'manual', status: 'idle', errorMessage: null })); };
  const setManualRate = (value) => setForm((current) => ({ ...current, exchange_rate: value }));

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

  const setField = (patch) => {
    // A material FX-relevant change (currency or date) means whatever
    // rate is currently known is no longer trustworthy as-is -- drop
    // the "pinned historical snapshot" guarantee and let the fetch
    // effect above resolve a fresh one for the new pair/date. Manual
    // mode is intentionally left alone: an explicit manual rate the
    // user already typed for one currency isn't silently cleared just
    // because they also nudged the date.
    if (('original_currency' in patch && patch.original_currency !== form.original_currency) || ('expense_date' in patch && patch.expense_date !== form.expense_date)) {
      pinnedRef.current = false;
      if (fx.mode === 'auto') setFx((current) => ({ ...current, status: 'idle' }));
    }
    setForm((current) => ({ ...current, ...patch }));
  };

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

  const setPaymentSource = (payment_source) => setForm((current) => ({
    ...current,
    payment_source,
    // The split-method section is hidden entirely while Trip Fund is
    // selected (the Fund was already financed by member contributions
    // up front -- there's no per-expense debt left to allocate). Reset
    // split_type back to the default so a stale Percentage/Exact/Shares
    // choice from a prior Member(s) session can never leak into a
    // Trip-Fund submission's payload once the section that edited it is
    // no longer even visible. The old split values themselves are left
    // untouched in state so switching back to Member(s) restores them.
    split_type: payment_source === 'trip_fund' ? 'equal' : current.split_type,
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

  const splitVisible = form.scope === 'shared' && form.payment_source !== 'trip_fund';

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
      payment_source: form.payment_source,
      category: form.category,
      scope: form.scope,
      expense_date: form.expense_date,
      notes: form.notes,
      // Split-method payload only makes sense while the split section is
      // actually visible -- a Trip-Fund expense's payload always carries
      // an equal-split participant list (still meaningful for analytics/
      // category reporting), never a stale Exact/Percentage/Shares
      // allocation left over from a Member(s) session the user switched
      // away from.
      split_type: splitVisible ? form.split_type : 'equal',
      payments,
    };
    // Same-currency: never send a rate at all -- the backend's own
    // identity shortcut always resolves it to exactly 1, no provider
    // call needed. Manual mode, or an edit whose currency/date/rate are
    // still exactly what was loaded (fx.pinned): send the rate
    // explicitly so the backend's snapshot-immutability check can
    // recognize "nothing actually changed" and keep the original
    // source/date label. Otherwise (a fresh auto-resolved rate for a
    // new/duplicated/currency-or-date-changed expense): omit it and let
    // the backend re-resolve authoritatively, so exchange_rate_source is
    // correctly stamped with the real provider name rather than being
    // mislabeled "manual" just because the frontend echoed back a value
    // it had only just fetched itself.
    if (isForeign && (fx.mode === 'manual' || pinnedRef.current)) {
      payload.exchange_rate = form.exchange_rate;
    }
    if (form.payment_source === 'trip_fund' || form.scope === 'personal') delete payload.payments;
    if (form.scope === 'shared') {
      if (!splitVisible || form.split_type === 'equal') {
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
  if (isForeign) {
    if (fx.mode === 'auto' && fx.status === 'loading') errors.exchangeRate = 'expenseComposer.errors.fxLoading';
    if (fx.mode === 'auto' && fx.status === 'error') errors.exchangeRate = 'expenseComposer.errors.fxUnresolved';
    if (fx.mode === 'manual' && (!form.exchange_rate || Number(form.exchange_rate) <= 0)) errors.exchangeRate = 'expenseComposer.errors.exchangeRateRequired';
  }
  if (form.scope === 'shared') {
    if (!form.participant_ids.length) errors.participants = 'expenseComposer.errors.participantsRequired';
    if (form.payment_source === 'personal') {
      if (!Object.keys(form.payments).length) errors.payments = 'expenseComposer.errors.payerRequired';
      else if (remainingPaymentCents !== 0) errors.payments = 'expenseComposer.errors.paymentsMustTotal';
    }
    if (splitVisible && form.split_type === 'percentage' && splitAssigned !== 100) errors.split = 'expenseComposer.errors.percentageMustTotal100';
    if (splitVisible && form.split_type === 'exact' && toCents(splitAssigned) !== toCents(baseAmount)) errors.split = 'expenseComposer.errors.exactMustTotal';
  }
  const isValid = Object.keys(errors).length === 0;

  return {
    form,
    fx,
    useManualRate,
    setManualRate,
    setField,
    setScope,
    setPaymentSource,
    togglePayer,
    setPayerAmount,
    toggleParticipant,
    selectAllParticipants,
    clearParticipants,
    setSplitValue,
    buildPayload,
    isForeign,
    splitVisible,
    baseAmount,
    remainingPaymentCents,
    splitAssigned,
    errors,
    isValid,
  };
}
