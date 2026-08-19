import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { avatarGlyph } from '../utils/avatars';

export const toCents = (value) => Math.round(Number(value || 0) * 100);
const categories = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other'];
const today = () => new Date().toISOString().slice(0, 10);

const initialForm = (members, expense) => {
  if (expense) return {
    title: expense.title, amount: expense.amount, category: expense.category, expense_date: expense.expense_date,
    notes: expense.notes || '', split_type: expense.split_type, participant_ids: expense.shares.map((row) => row.member_id),
    payments: Object.fromEntries(expense.payments.map((row) => [row.member_id, row.amount])),
    splitValues: Object.fromEntries(expense.shares.map((row) => [row.member_id, row.percentage || row.weight || row.amount])),
  };
  return { title: '', amount: '', category: 'other', expense_date: today(), notes: '', split_type: 'equal', participant_ids: members.map((m) => m.id), payments: members[0] ? { [members[0].id]: '' } : {}, splitValues: {} };
};

const ExpenseForm = ({ members, expense, onSubmit, onCancel, disabled }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => initialForm(members, expense));
  useEffect(() => setForm(initialForm(members, expense)), [expense, members]);
  const paymentCents = useMemo(() => Object.values(form.payments).reduce((sum, value) => sum + toCents(value), 0), [form.payments]);
  const remaining = toCents(form.amount) - paymentCents;
  const splitAssigned = Object.values(form.splitValues).reduce((sum, value) => sum + Number(value || 0), 0);
  const toggle = (id) => setForm((current) => ({ ...current, participant_ids: current.participant_ids.includes(id) ? current.participant_ids.filter((value) => value !== id) : [...current.participant_ids, id] }));
  const togglePayer = (id) => setForm((current) => { const payments = { ...current.payments }; if (id in payments) delete payments[id]; else payments[id] = ''; return { ...current, payments }; });
  const submit = (event) => {
    event.preventDefault();
    const payments = Object.entries(form.payments).map(([member_id, amount]) => ({ member_id, amount }));
    const payload = { title: form.title, amount: form.amount, category: form.category, expense_date: form.expense_date, notes: form.notes, split_type: form.split_type, payments };
    if (form.split_type === 'equal') payload.participant_ids = form.participant_ids;
    else payload.shares = form.participant_ids.map((member_id) => ({ member_id, [form.split_type === 'exact' ? 'amount' : form.split_type === 'percentage' ? 'percentage' : 'weight']: form.splitValues[member_id] || '' }));
    onSubmit(payload);
  };
  const obviousInvalid = !form.participant_ids.length || !Object.keys(form.payments).length || remaining !== 0 || (form.split_type === 'percentage' && splitAssigned !== 100) || (form.split_type === 'exact' && toCents(splitAssigned) !== toCents(form.amount));
  return <form onSubmit={submit} className="expense-form">
    <label>{t('expense.description')}<input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
    <label>{t('expense.amount')}<input className="pc-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
    <label>{t('expense.category')}<select className="pc-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((value) => <option key={value} value={value}>{t(`category.${value}`)}</option>)}</select></label>
    <label>{t('expense.date')}<input className="pc-input" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required /></label>
    <fieldset><legend>{t('expense.payers')}</legend>{members.map((member) => <div className="allocation-row" key={member.id}><label><input type="checkbox" checked={member.id in form.payments} onChange={() => togglePayer(member.id)} /> {avatarGlyph(member.avatar_key)} {member.display_name}</label>{member.id in form.payments && <input aria-label={`${member.display_name} ${t('expense.paidAmount')}`} type="number" min="0.01" step="0.01" value={form.payments[member.id]} onChange={(e) => setForm({ ...form, payments: { ...form.payments, [member.id]: e.target.value } })} />}</div>)}</fieldset>
    <p>{t('expense.remaining')}: {(remaining / 100).toFixed(2)}</p>
    <label>{t('expense.splitMethod')}<select className="pc-input" value={form.split_type} onChange={(e) => setForm({ ...form, split_type: e.target.value })}>{['equal', 'exact', 'percentage', 'shares'].map((value) => <option key={value} value={value}>{t(`split.${value}`)}</option>)}</select></label>
    <div className="form-actions"><button type="button" onClick={() => setForm({ ...form, participant_ids: members.map((m) => m.id) })}>{t('common.selectAll')}</button><button type="button" onClick={() => setForm({ ...form, participant_ids: [] })}>{t('common.clear')}</button></div>
    <fieldset><legend>{t('expense.participants')}</legend>{members.map((member) => <div className="allocation-row" key={member.id}><label><input type="checkbox" checked={form.participant_ids.includes(member.id)} onChange={() => toggle(member.id)} /> {avatarGlyph(member.avatar_key)} {member.display_name}</label>{form.split_type !== 'equal' && form.participant_ids.includes(member.id) && <input aria-label={`${member.display_name} ${t(`split.${form.split_type}`)}`} type="number" min="0.0001" step="0.01" value={form.splitValues[member.id] || ''} onChange={(e) => setForm({ ...form, splitValues: { ...form.splitValues, [member.id]: e.target.value } })} />}</div>)}</fieldset>
    {form.split_type === 'percentage' && <p>{t('expense.assigned')}: {splitAssigned}%</p>}
    <label>{t('expense.notes')}<textarea className="pc-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    <div className="form-actions"><button className="pc-btn-create" disabled={disabled || obviousInvalid}>{expense ? t('expense.save') : t('expense.add')}</button>{onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}</div>
  </form>;
};
export default ExpenseForm;
