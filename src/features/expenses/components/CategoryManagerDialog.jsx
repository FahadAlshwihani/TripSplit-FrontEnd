import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import { CATEGORY_COLOR_KEYS, CATEGORY_ICON_KEYS, categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../shared/utils/categoryPresentation';

const emptyDraft = { name: '', icon_key: 'tag', color: '', budget: '' };

/*
  Trip category management -- create custom categories, allocate/reset
  their budgets, rename/recolor/re-icon a custom one, deactivate it.
  Reuses the existing categories/category-budgets API (nothing new was
  added here beyond the color/icon_key fields themselves); the previous
  standalone /trips/:id/categories page (CategoryManager.jsx, window.
  prompt()-based) is left in place but this modal is the intended entry
  point going forward, reachable from the Expenses Ledger's own utility
  bar so category planning stays next to where expenses actually happen.
*/
const CategoryManagerDialog = ({ categories, budgets, currency, canManage, onCreate, onUpdate, onArchive, onSetBudget, onResetBudget, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [editingCode, setEditingCode] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => { dialogRef.current?.focus(); }, []);

  const budgetsByCode = Object.fromEntries(budgets.map((row) => [row.category, row]));

  const startEdit = (category) => {
    const budget = budgetsByCode[category.code];
    setEditingCode(category.code);
    setCreating(false);
    setDraft({ name: category.name, icon_key: category.icon_key, color: category.color || '', budget: budget?.budget || '' });
  };

  const startCreate = () => {
    setCreating(true);
    setEditingCode(null);
    setDraft(emptyDraft);
  };

  const cancelEdit = () => { setEditingCode(null); setCreating(false); setDraft(emptyDraft); };

  const saveEdit = (category) => {
    onUpdate(category.id, { name: draft.name, icon_key: draft.icon_key, color: draft.color });
    if (draft.budget) onSetBudget({ category: category.code, budget: draft.budget, currency });
    cancelEdit();
  };

  const saveCreate = (event) => {
    event.preventDefault();
    onCreate({ name: draft.name, icon_key: draft.icon_key, color: draft.color });
    cancelEdit();
  };

  const PickerRow = ({ label, options, value, onPick, render }) => (
    <div className="exp-cat-picker">
      <span className="exp-cat-picker__label">{label}</span>
      <div className="exp-cat-picker__options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`exp-cat-picker__option${value === option ? ' is-selected' : ''}`}
            aria-pressed={value === option}
            aria-label={option}
            onClick={() => onPick(option)}
          >
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ModalPortal>
      <div className="exp-modal-overlay" role="presentation" onClick={onClose}>
        <div ref={dialogRef} tabIndex={-1} className="exp-modal" role="dialog" aria-modal="true" aria-labelledby="exp-category-manager-title" onClick={(event) => event.stopPropagation()}>
          <div className="exp-modal__head">
            <h2 id="exp-category-manager-title" className="exp-modal__title text-headline-sm">{t('categoriesManager.title')}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="exp-modal__body">
            <ul className="exp-cat-list">
              {categories.map((category) => {
                const budget = budgetsByCode[category.code];
                const hasBudget = Boolean(budget);
                const overBudget = hasBudget && Number(budget.remaining) < 0;
                const isEditing = editingCode === category.code;
                return (
                  <li className="exp-cat-row" key={category.id}>
                    <div className="exp-cat-row__main">
                      <span className="exp-cat-row__icon" style={{ background: categoryTileColor(category.code, category.color) }}>
                        <i className={`bi ${categoryIconClass(category.icon_key)}`} aria-hidden="true" />
                      </span>
                      <div className="exp-cat-row__text">
                        <span className="exp-cat-row__name">
                          {categoryLabel(t, category.code, category.name)}
                          {category.is_default && <span className="exp-cat-row__badge">{t('categoriesManager.default')}</span>}
                        </span>
                        {hasBudget ? (
                          <span className={`exp-cat-row__budget${overBudget ? ' exp-cat-row__budget--over' : ''}`}>
                            <Money value={budget.spent} currency={currency} variant="tabular" /> {' / '}
                            <Money value={budget.budget} currency={currency} variant="tabular" />
                            {overBudget && <span className="exp-cat-row__over-badge">{t('dashboard.overview.overBudget')}</span>}
                          </span>
                        ) : (
                          <span className="exp-cat-row__budget exp-cat-row__budget--none">{t('categoriesManager.noBudget')}</span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="exp-cat-row__actions">
                        <button type="button" className="exp-utility-btn" aria-label={t('common.edit')} onClick={() => (isEditing ? cancelEdit() : startEdit(category))}>
                          <i className={`bi ${isEditing ? 'bi-x-lg' : 'bi-pencil'}`} aria-hidden="true" />
                        </button>
                        {!category.is_default && (
                          <button type="button" className="exp-utility-btn" aria-label={t('categoriesManager.archive')} onClick={() => onArchive(category.id)}>
                            <i className="bi bi-archive" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                    {isEditing && (
                      <div className="exp-cat-edit">
                        <label className="exp-filter-field">
                          <span className="exp-filter-field__label">{t('categoriesManager.namePlaceholder')}</span>
                          <input className="exp-filter-field__control" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} disabled={category.is_default} />
                        </label>
                        {!category.is_default && (
                          <>
                            <PickerRow label={t('categoriesManager.icon')} options={CATEGORY_ICON_KEYS} value={draft.icon_key} onPick={(icon_key) => setDraft({ ...draft, icon_key })} render={(icon) => <i className={`bi ${categoryIconClass(icon)}`} aria-hidden="true" />} />
                            <PickerRow label={t('categoriesManager.color')} options={CATEGORY_COLOR_KEYS} value={draft.color} onPick={(color) => setDraft({ ...draft, color })} render={(color) => <span className="exp-cat-picker__swatch" style={{ background: categoryColor(category.code, color) }} />} />
                          </>
                        )}
                        <label className="exp-filter-field">
                          <span className="exp-filter-field__label">{t('categoriesManager.budgetPlaceholder')}</span>
                          <input type="number" min="0" step="0.01" className="exp-filter-field__control" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} />
                        </label>
                        <div className="exp-cat-edit__actions">
                          {hasBudget && <button type="button" className="exp-text-link" onClick={() => { onResetBudget(category.id); cancelEdit(); }}>{t('categoriesManager.resetBudget')}</button>}
                          <button type="button" className="dash-btn dash-btn--primary" onClick={() => saveEdit(category)}>{t('common.save')}</button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {canManage && (
              creating ? (
                <form className="exp-cat-edit exp-cat-create" onSubmit={saveCreate}>
                  <label className="exp-filter-field">
                    <span className="exp-filter-field__label">{t('categoriesManager.namePlaceholder')}</span>
                    <input className="exp-filter-field__control" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required autoFocus />
                  </label>
                  <PickerRow label={t('categoriesManager.icon')} options={CATEGORY_ICON_KEYS} value={draft.icon_key} onPick={(icon_key) => setDraft({ ...draft, icon_key })} render={(icon) => <i className={`bi ${categoryIconClass(icon)}`} aria-hidden="true" />} />
                  <PickerRow label={t('categoriesManager.color')} options={CATEGORY_COLOR_KEYS} value={draft.color} onPick={(color) => setDraft({ ...draft, color })} render={(color) => <span className="exp-cat-picker__swatch" style={{ background: categoryColor('other', color) }} />} />
                  <div className="exp-cat-edit__actions">
                    <button type="button" className="exp-text-link" onClick={cancelEdit}>{t('common.cancel')}</button>
                    <button type="submit" className="dash-btn dash-btn--primary">{t('categoriesManager.create')}</button>
                  </div>
                </form>
              ) : (
                <button type="button" className="dash-btn dash-btn--secondary exp-cat-add-btn" onClick={startCreate}>
                  <i className="bi bi-plus-lg" aria-hidden="true" /> {t('categoriesManager.addNew')}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CategoryManagerDialog;
