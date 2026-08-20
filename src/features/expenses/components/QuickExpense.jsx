import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const today = () => new Date().toISOString().slice(0, 10);

export const QuickExpense = ({ currentMember, members, categories, onSubmit, onMore }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ amount: '', title: '', category: categories.find((row) => row.code === 'other')?.code || categories[0]?.code || 'other', scope: 'shared' });
  const submit = (event) => {
    event.preventDefault();
    const payload = { title: form.title, amount: form.amount, category: form.category, scope: form.scope, expense_date: today(), notes: '', split_type: 'equal' };
    if (form.scope === 'shared') { payload.payments = [{ member_id: currentMember.id, amount: form.amount }]; payload.participant_ids = members.map((member) => member.id); }
    onSubmit(payload);
  };
  return <form className="expense-form quick-expense" onSubmit={submit}>
    <fieldset><legend>{t('expense.scope.title')}</legend>{['shared', 'personal'].map((scope) => <label key={scope}><input type="radio" name="quick-scope" checked={form.scope === scope} onChange={() => setForm({ ...form, scope })} /> {t(`expense.scope.${scope}`)}</label>)}</fieldset>
    <label>{t('expense.amount')}<input className="pc-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label>
    <label>{t('expense.description')}<input className="pc-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
    <label>{t('expense.category')}<select className="pc-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((row) => <option key={row.id} value={row.code}>{row.name}</option>)}</select></label>
    <p>{form.scope === 'shared' ? t('quick.sharedDefaults', { count: members.length }) : t('quick.personalDefaults')}</p>
    <div className="form-actions"><button className="pc-btn-create">{t('quick.save')}</button><button type="button" onClick={onMore}>{t('quick.more')}</button></div>
  </form>;
};

export default QuickExpense;
