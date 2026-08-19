import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CategoryManager = ({ categories, budgets, budgetSummary, currency, canManage, onCreate, onUpdate, onArchive, onBudget, onResetBudget }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const budgetFor = (code) => budgets.find((row) => row.category === code);
  return <section className="card-pc"><h2>{t('categories.title')}</h2>{budgetSummary && <div className="summary-grid"><p>{t('categories.tripBudget')}: {budgetSummary.trip_budget} {currency}</p><p>{t('categories.allocated')}: {budgetSummary.allocated} {currency}</p><p>{t('categories.unallocated')}: {budgetSummary.unallocated} {currency}</p></div>}
    {canManage && <form onSubmit={(event) => { event.preventDefault(); onCreate({ name, icon_key: 'tag', sort_order: categories.length + 20 }); setName(''); }}><label>{t('categories.newName')}<input className="pc-input" value={name} onChange={(event) => setName(event.target.value)} required /></label><button className="pc-btn-create">{t('categories.create')}</button></form>}
    <div className="categories-list">{categories.map((category) => { const budget = budgetFor(category.code); const over = budget && Number(budget.remaining) < 0; return <article className="category-item" key={category.id}><div><strong>{category.icon_key} · {category.name}</strong><small>{category.is_default ? t('categories.default') : t('categories.custom')}</small></div>{budget ? <div><p>{budget.spent} / {budget.budget} {currency} · {budget.usage_percentage}%</p><progress max="100" value={Math.min(Number(budget.usage_percentage), 100)} /><p>{over ? t('categories.over', { amount: Math.abs(Number(budget.remaining)).toFixed(2) }) : t('categories.remaining', { amount: budget.remaining })}</p></div> : <p>{t('categories.noBudget')}</p>}{canManage && <div className="row-actions">{!category.is_default && <><button onClick={() => { const next = window.prompt(t('categories.rename'), category.name); if (next) onUpdate(category, { name: next }); }}>{t('common.edit')}</button><button onClick={() => onArchive(category)}>{t('categories.archive')}</button></>}<button onClick={() => { const value = window.prompt(t('categories.setBudget'), budget?.budget || ''); if (value !== null && value !== '') onBudget(category, value); }}>{budget ? t('common.edit') : t('categories.setBudget')}</button>{budget && <button onClick={() => onResetBudget(category)}>{t('categories.reset')}</button>}</div>}</article>; })}</div>
  </section>;
};

export default CategoryManager;
