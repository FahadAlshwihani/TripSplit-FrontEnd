import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import ExpenseFilterPopover from './ExpenseFilterPopover';

const SEARCH_DEBOUNCE_MS = 350;

/*
  Search + All/Shared/Personal + Filter + New Expense, in that inline-
  logical order (see expenses.css: flex row, no left/right hardcoding,
  so this mirrors naturally under dir="rtl"). New Expense sits last --
  "the final high-priority control at the inline end of the utility bar"
  per the brief.
*/
const ExpenseFilterBar = ({ filters, setFilters, hasActiveFilters, categories, canCreateExpense, onNewExpense, onManageCategories }) => {
  const { t } = useTranslation();
  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef(null);

  // Reflects external filter resets (e.g. "Clear filters") back into the
  // input without fighting the user's own typing -- only syncs when the
  // URL's search value itself changed, not on every render.
  useEffect(() => { setSearchDraft(filters.search || ''); }, [filters.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== (filters.search || '')) setFilters({ search: searchDraft });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const scopeOptions = [
    { value: '', label: t('expenses.ledger.filterAll') },
    { value: 'shared', label: t('expenses.ledger.filterShared') },
    { value: 'personal', label: t('expenses.ledger.filterPersonal') },
  ];

  return (
    <div className="exp-toolbar">
      <div className="exp-toolbar__search">
        <i className="bi bi-search exp-toolbar__search-icon" aria-hidden="true" />
        <label className="dash-visually-hidden" htmlFor="exp-search">{t('expenses.ledger.searchPlaceholder')}</label>
        <input
          id="exp-search"
          type="search"
          className="exp-toolbar__search-input"
          placeholder={t('expenses.ledger.searchPlaceholder')}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
      </div>
      <div className="exp-toolbar__controls">
        <SegmentedControl
          ariaLabel={t('expenses.ledger.filterAll')}
          options={scopeOptions}
          value={filters.scope || ''}
          onChange={(scope) => setFilters({ scope })}
        />
        <button
          ref={filterTriggerRef}
          type="button"
          className={`exp-utility-btn${hasActiveFilters ? ' is-active' : ''}`}
          aria-label={t('expenses.ledger.filter')}
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((open) => !open)}
        >
          <i className="bi bi-funnel" aria-hidden="true" />
        </button>
        {/* Secondary, deliberately never competing visually with the
            primary New Expense action -- view-only for a non-admin
            member (the dialog itself gates create/edit/archive on
            canManageMembers), so it's never hidden entirely. */}
        <button type="button" className="dash-btn dash-btn--secondary" aria-label={t('categoriesManager.title')} onClick={onManageCategories}>
          <i className="bi bi-tags" aria-hidden="true" />
          <span className="dash-btn__label" aria-hidden="true">{t('categoriesManager.title')}</span>
        </button>
        {canCreateExpense && (
          <button type="button" className="dash-btn dash-btn--primary" aria-label={t('expenses.ledger.newExpense')} onClick={onNewExpense}>
            <i className="bi bi-plus-lg" aria-hidden="true" />
            <span className="dash-btn__label" aria-hidden="true">{t('expenses.ledger.newExpense')}</span>
          </button>
        )}
      </div>
      {filterOpen && (
        <ExpenseFilterPopover
          categories={categories}
          filters={filters}
          triggerRef={filterTriggerRef}
          onApply={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
};

export default ExpenseFilterBar;
