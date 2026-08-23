import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

export const toCents = (value) => Math.round(Number(value || 0) * 100);
const today = () => new Date().toISOString().slice(0, 10);
const DEFAULT_CATEGORIES = [];

export const CURRENCIES = ['SAR','USD','EUR','GBP','AED','QAR','KWD','BHD','OMR','GEL','TRY','JPY','CHF','CAD','AUD'];

const initialForm = (members, expense, currentMember, categories, tripCurrency) => {
  if (expense) return {
    title: expense.title, amount: expense.original_amount || expense.amount, original_currency: expense.original_currency || tripCurrency, exchange_rate: expense.exchange_rate || '1', payment_source: expense.payment_source || 'personal', category: expense.category, scope: expense.scope || 'shared', expense_date: expense.expense_date,
    notes: expense.notes || '', split_type: expense.split_type, participant_ids: expense.shares.map((row) => row.member_id),
    payments: Object.fromEntries(expense.payments.map((row) => [row.member_id, row.amount])),
    splitValues: Object.fromEntries(expense.shares.map((row) => [row.member_id, row.percentage || row.weight || row.amount])),
  };
  const payer = currentMember || members[0];
  return { title: '', amount: '', original_currency: tripCurrency, exchange_rate: '1', payment_source: 'personal', category: categories.find((item) => item.code === 'other')?.code || categories[0]?.code || 'other', scope: 'shared', expense_date: today(), notes: '', split_type: 'equal', participant_ids: members.map((m) => m.id), payments: payer ? { [payer.id]: '' } : {}, splitValues: {} };
};

const ExpenseForm = ({ members, categories = DEFAULT_CATEGORIES, currentMember, tripCurrency = 'SAR', hasFund = false, expense, onSubmit, onCancel, disabled }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => initialForm(members, expense, currentMember, categories, tripCurrency));
  useEffect(() => setForm(initialForm(members, expense, currentMember, categories, tripCurrency)), [expense, members, currentMember, categories, tripCurrency]);
  const baseAmount = form.original_currency === tripCurrency ? Number(form.amount || 0) : Number(form.amount || 0) * Number(form.exchange_rate || 0);
  const paymentCents = useMemo(() => Object.values(form.payments).reduce((sum, value) => sum + toCents(value), 0), [form.payments]);
  const remaining = toCents(baseAmount) - paymentCents;
  const splitAssigned = Object.values(form.splitValues).reduce((sum, value) => sum + Number(value || 0), 0);
  const toggle = (id) => setForm((current) => ({ ...current, participant_ids: current.participant_ids.includes(id) ? current.participant_ids.filter((value) => value !== id) : [...current.participant_ids, id] }));
  const togglePayer = (id) => setForm((current) => { const payments = { ...current.payments }; if (id in payments) delete payments[id]; else payments[id] = ''; return { ...current, payments }; });
  const submit = (event) => {
    event.preventDefault();
    const payments = Object.entries(form.payments).map(([member_id, amount]) => ({ member_id, amount }));
    const payload = { title: form.title, amount: form.amount, original_currency: form.original_currency, exchange_rate: form.original_currency === tripCurrency ? '1' : form.exchange_rate, payment_source: form.payment_source, category: form.category, scope: form.scope, expense_date: form.expense_date, notes: form.notes, split_type: form.split_type, payments };
    if (form.payment_source === 'trip_fund') delete payload.payments;
    if (form.scope === 'personal') delete payload.payments;
    else if (form.split_type === 'equal') payload.participant_ids = form.participant_ids;
    else payload.shares = form.participant_ids.map((member_id) => ({ member_id, [form.split_type === 'exact' ? 'amount' : form.split_type === 'percentage' ? 'percentage' : 'weight']: form.splitValues[member_id] || '' }));
    onSubmit(payload);
  };
  const obviousInvalid = form.scope === 'shared' && (!form.participant_ids.length || (form.payment_source === 'personal' && (!Object.keys(form.payments).length || remaining !== 0)) || (form.split_type === 'percentage' && splitAssigned !== 100) || (form.split_type === 'exact' && toCents(splitAssigned) !== toCents(baseAmount)));
  return <form onSubmit={submit} className="expense-form">
    <fieldset><legend>{t('expense.scope.title')}</legend><label><input type="radio" name="scope" checked={form.scope === 'shared'} onChange={() => setForm({ ...form, scope: 'shared' })} /> {t('expense.scope.shared')}</label><label><input type="radio" name="scope" checked={form.scope === 'personal'} onChange={() => setForm({ ...form, scope: 'personal', payments: currentMember ? { [currentMember.id]: form.amount } : form.payments })} /> {t('expense.scope.personal')}</label></fieldset>
    <label>{t('expense.description')}<input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
    <label>{t('expense.amount')}<input className="pc-input" inputMode="decimal" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
    <label>{t('currency.original')}<select className="pc-input" value={form.original_currency} onChange={(e) => setForm({ ...form, original_currency: e.target.value, exchange_rate: e.target.value === tripCurrency ? '1' : '' })}>{CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select></label>
    {form.original_currency !== tripCurrency && <fieldset><legend>{t('currency.rate')}</legend><label>1 {form.original_currency} = <input aria-label={t('currency.rate')} inputMode="decimal" type="number" min="0.00000001" step="0.00000001" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} required /> {tripCurrency}</label><p>{t('currency.converted')}: {baseAmount.toFixed(2)} {tripCurrency}</p><small>{t('currency.locked')}</small></fieldset>}
    {form.scope === 'shared' && <fieldset><legend>{t('expense.paymentSource')}</legend><label><input type="radio" name="paymentSource" checked={form.payment_source === 'personal'} onChange={() => setForm({ ...form, payment_source: 'personal' })} /> {t('expense.personalPayment')}</label>{hasFund && <label><input type="radio" name="paymentSource" checked={form.payment_source === 'trip_fund'} onChange={() => setForm({ ...form, payment_source: 'trip_fund' })} /> {t('fund.paidFromFund')}</label>}</fieldset>}
    <label>{t('expense.category')}<select className="pc-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item.id} value={item.code}>{t(`category.${item.code}`, { defaultValue: item.name })}</option>)}</select></label>
    <label>{t('expense.date')}<input className="pc-input" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required /></label>
    {form.scope === 'shared' && <>{form.payment_source === 'personal' && <><fieldset><legend>{t('expense.payers')}</legend>{members.map((member) => <div className="allocation-row" key={member.id}><label><input type="checkbox" checked={member.id in form.payments} onChange={() => togglePayer(member.id)} /> <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" /> {member.display_name}</label>{member.id in form.payments && <input aria-label={`${member.display_name} ${t('expense.paidAmount')}`} inputMode="decimal" type="number" min="0.01" step="0.01" value={form.payments[member.id]} onChange={(e) => setForm({ ...form, payments: { ...form.payments, [member.id]: e.target.value } })} />}</div>)}</fieldset><p>{t('expense.remaining')}: {(remaining / 100).toFixed(2)}</p></>}
    <label>{t('expense.splitMethod')}<select className="pc-input" value={form.split_type} onChange={(e) => setForm({ ...form, split_type: e.target.value })}>{['equal', 'exact', 'percentage', 'shares'].map((value) => <option key={value} value={value}>{t(`split.${value}`)}</option>)}</select></label>
    <div className="form-actions"><button type="button" onClick={() => setForm({ ...form, participant_ids: members.map((m) => m.id) })}>{t('common.selectAll')}</button><button type="button" onClick={() => setForm({ ...form, participant_ids: [] })}>{t('common.clear')}</button></div>
    <fieldset><legend>{t('expense.participants')}</legend>{members.map((member) => <div className="allocation-row" key={member.id}><label><input type="checkbox" checked={form.participant_ids.includes(member.id)} onChange={() => toggle(member.id)} /> <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" /> {member.display_name}</label>{form.split_type !== 'equal' && form.participant_ids.includes(member.id) && <input aria-label={`${member.display_name} ${t(`split.${form.split_type}`)}`} type="number" min="0.0001" step="0.01" value={form.splitValues[member.id] || ''} onChange={(e) => setForm({ ...form, splitValues: { ...form.splitValues, [member.id]: e.target.value } })} />}</div>)}</fieldset>
    {form.split_type === 'percentage' && <p>{t('expense.assigned')}: {splitAssigned}%</p>}</>}
    <label>{t('expense.notes')}<textarea className="pc-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    <div className="form-actions"><button className="pc-btn-create" disabled={disabled || obviousInvalid}>{expense ? t('expense.save') : t('expense.add')}</button>{onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}</div>
  </form>;
};
export default ExpenseForm;
