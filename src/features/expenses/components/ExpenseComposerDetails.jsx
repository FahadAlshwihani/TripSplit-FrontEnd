import React from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyPicker from '../../../shared/components/CurrencyPicker';
import CategorySelect from './CategorySelect';
import Money from '../../../shared/components/Money';
import { categoryLabel } from '../../../shared/utils/categoryPresentation';

/*
  Section 1 -- Description / Category / Date / Currency / Amount, plus
  the multi-currency FX summary (only rendered when the original
  currency differs from the trip's own -- same-currency expenses never
  show a conversion block at all, per the brief). The exchange rate
  itself stays a manual field: there is no live FX-rate service anywhere
  in this backend (confirmed by audit), so this mirrors the old
  ExpenseForm's own manual-rate behavior exactly rather than inventing
  a browser-side authoritative rate lookup.
*/
const ExpenseComposerDetails = ({ form, setField, errors, categories, budgets, tripCurrency, isForeign, baseAmount }) => {
  const { t } = useTranslation();
  const budget = budgets.find((row) => row.category === form.category);
  const selectedCategory = categories.find((category) => category.code === form.category);

  return (
    <section className="exp-composer__section">
      <h3 className="exp-composer__section-title">{t('expenseComposer.sections.details')}</h3>

      <div className="field-group">
        <label className="field-label" htmlFor="exp-title">{t('expense.description')}</label>
        <input
          id="exp-title"
          className={`field-control${errors.title ? ' field-control--error' : ''}`}
          value={form.title}
          onChange={(event) => setField({ title: event.target.value })}
          placeholder={t('expenseComposer.descriptionPlaceholder')}
        />
        {errors.title && <p className="field-error" role="alert">{t(errors.title)}</p>}
      </div>

      <div className="exp-composer__grid">
        <div className="field-group">
          <label className="field-label" htmlFor="exp-category">{t('expense.category')}</label>
          <CategorySelect id="exp-category" categories={categories} value={form.category} onChange={(code) => setField({ category: code })} />
          {errors.category && <p className="field-error" role="alert">{t(errors.category)}</p>}
          {budget && (
            <p className="exp-composer__budget-hint">
              {t('expenseComposer.categoryBudgetHint', {
                category: categoryLabel(t, selectedCategory?.code, selectedCategory?.name),
              })}
              {' '}
              <Money value={budget.spent} currency={tripCurrency} variant="tabular" />
              {' / '}
              <Money value={budget.budget} currency={tripCurrency} variant="tabular" />
              {Number(budget.remaining) < 0 && <span className="exp-composer__budget-hint--over"> {t('dashboard.overview.overBudget')}</span>}
            </p>
          )}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="exp-date">{t('expense.date')}</label>
          <input
            id="exp-date"
            type="date"
            className="field-control"
            value={form.expense_date}
            onChange={(event) => setField({ expense_date: event.target.value })}
          />
        </div>
      </div>

      <div className="exp-composer__grid">
        <div className="field-group">
          <label className="field-label" htmlFor="exp-currency">{t('currency.original')}</label>
          <CurrencyPicker id="exp-currency" value={form.original_currency} onChange={(code) => setField({ original_currency: code, exchange_rate: code === tripCurrency ? '1' : form.exchange_rate })} label={t('currency.original')} />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="exp-amount">{t('expense.amount')}</label>
          <input
            id="exp-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className={`field-control field-control--amount${errors.amount ? ' field-control--error' : ''}`}
            value={form.amount}
            onChange={(event) => setField({ amount: event.target.value })}
          />
          {errors.amount && <p className="field-error" role="alert">{t(errors.amount)}</p>}
        </div>
      </div>

      {isForeign && (
        <div className="exp-composer__fx-card">
          <div className="field-group">
            <label className="field-label" htmlFor="exp-rate">{t('currency.rate')}</label>
            <div className="exp-composer__fx-rate-row">
              <span>1 {form.original_currency} =</span>
              <input
                id="exp-rate"
                type="number"
                inputMode="decimal"
                min="0.00000001"
                step="0.00000001"
                className="field-control"
                value={form.exchange_rate}
                onChange={(event) => setField({ exchange_rate: event.target.value })}
              />
              <span>{tripCurrency}</span>
            </div>
            <p className="exp-composer__fx-note text-copy-sm">{t('currency.locked')}</p>
          </div>
          <div className="exp-composer__fx-summary">
            <div className="exp-composer__fx-summary-row">
              <span>{t('currency.original')}</span>
              <Money value={form.amount} currency={form.original_currency} variant="tabular" />
            </div>
            <div className="exp-composer__fx-summary-row">
              <span>{t('currency.converted')}</span>
              <Money value={baseAmount} currency={tripCurrency} variant="tabular" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseComposerDetails;
