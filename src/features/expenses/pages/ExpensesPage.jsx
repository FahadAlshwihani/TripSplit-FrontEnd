import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeoLoading from '../../../shared/components/NeoLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import useExpenseFilters from '../hooks/useExpenseFilters';
import { addExpense, deleteExpense, getExpenses, getExpensesSummary, getPage, updateExpense } from '../api/expensesApi';
import { archiveCategory, createCategory, getCategories, getCategoryBudgets, resetCategoryBudget, setCategoryBudget, updateCategory } from '../../categories/api/categoriesApi';
import { getMembers } from '../../members/api/membersApi';
import { getFund } from '../../funds/api/fundsApi';
import { membersById as buildMembersById } from '../utils/expensePresentation';
import ExpenseSummaryCards from '../components/ExpenseSummaryCards';
import ExpenseFilterBar from '../components/ExpenseFilterBar';
import ExpenseLedgerList from '../components/ExpenseLedgerList';
import NewExpenseDialog from '../components/NewExpenseDialog';
import ExpenseDetailsDialog from '../components/ExpenseDetailsDialog';
import CategoryManagerDialog from '../components/CategoryManagerDialog';
import '../styles/expenses.css';

const fulfilledValue = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);

export default function ExpensesPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useExpenseFilters();
  const [dialog, setDialog] = useState(null); // { mode: 'create' | 'edit', expense? } | null
  const [detailsExpense, setDetailsExpense] = useState(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  const summaryResource = useRouteResource((signal) => getExpensesSummary(tripId, { signal }), [tripId]);

  const helpersResource = useRouteResource(async (signal) => {
    const results = await Promise.allSettled([
      getCategories(tripId, { signal }),
      getCategoryBudgets(tripId, { signal }),
      getMembers(tripId, { signal }),
      getFund(tripId, { signal }),
    ]);
    return {
      categories: fulfilledValue(results[0], { results: [] }).results,
      budgets: fulfilledValue(results[1], { results: [] }).results,
      members: fulfilledValue(results[2], { results: [] }).results,
      fund: fulfilledValue(results[3], null),
      helperError: results.some((result) => result.status === 'rejected'),
    };
  }, [tripId]);

  // Re-fetches whenever the URL-driven filters change (see
  // useExpenseFilters); resetOnKeyChange clears stale rows immediately
  // rather than leaving the previous filter's results on screen mid-load.
  const listResource = useRouteResource(
    (signal) => getExpenses(tripId, { signal, params: filters }),
    [tripId, filters],
    true,
  );

  const run = async (action) => {
    try {
      await action();
      setActionError(null);
      await Promise.all([listResource.retry(), summaryResource.retry()]);
    } catch (error) {
      setActionError(error);
    }
  };

  const save = (payload) => run(async () => {
    if (dialog?.expense && !dialog.expense.duplicate) await updateExpense(tripId, dialog.expense.id, payload);
    else await addExpense(tripId, { ...payload, idempotency_key: crypto.randomUUID() });
    setDialog(null);
    setDetailsExpense(null);
  });

  const remove = (expense) => run(async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('expense.confirmDelete'))) return;
    await deleteExpense(tripId, expense.id);
    setDetailsExpense(null);
  });

  // Category mutations only ever affect helpersResource's own data
  // (categories/budgets) -- never the summary cards (payment_source-
  // based, unaffected by category budgeting) or the expense list itself
  // (a renamed/recolored category resolves live via categoriesByCode on
  // the next render, no expense row data actually changed).
  const runCategoryAction = async (action) => {
    try {
      await action();
      setActionError(null);
      await helpersResource.retry();
    } catch (error) {
      setActionError(error);
    }
  };
  const createCategoryAction = (payload) => runCategoryAction(() => createCategory(tripId, payload));
  const updateCategoryAction = (categoryId, payload) => runCategoryAction(() => updateCategory(tripId, categoryId, payload));
  const archiveCategoryAction = (categoryId) => runCategoryAction(() => archiveCategory(tripId, categoryId));
  const setCategoryBudgetAction = (payload) => runCategoryAction(() => setCategoryBudget(tripId, payload));
  const resetCategoryBudgetAction = (categoryId) => runCategoryAction(() => resetCategoryBudget(tripId, categoryId));

  if (summaryResource.loading || helpersResource.loading) return <NeoLoading />;
  if (summaryResource.error || helpersResource.error) {
    return <ErrorState title={t('expenses.ledger.errorLoad')} onRetry={() => { summaryResource.retry(); helpersResource.retry(); }} />;
  }

  const { categories, budgets, members, fund, helperError } = helpersResource.data;
  const categoriesByCode = Object.fromEntries(categories.map((category) => [category.code, category]));
  const membersLookup = buildMembersById(members);
  const rows = listResource.data?.results || [];
  const loadMore = () => listResource.loadMore(
    (signal) => getPage(listResource.data.next, tripId, { signal }),
    (current, page) => ({ ...page, results: [...current.results, ...page.results] }),
  );

  return (
    <div className="exp-page">
      <div className="exp-page__header">
        <h1 className="exp-page__title text-display">{t('expenses.ledger.title')}</h1>
        <p className="exp-page__subtitle text-copy-lg">{t('expenses.ledger.subtitle')}</p>
      </div>

      {actionError && <ErrorState message={actionError.message} />}
      {helperError && <ErrorState message={t('common.partialDataError')} onRetry={helpersResource.retry} />}

      <ExpenseSummaryCards summary={summaryResource.data} currency={trip.currency} />

      <ExpenseFilterBar
        filters={filters}
        setFilters={setFilters}
        hasActiveFilters={hasActiveFilters}
        categories={categories}
        canCreateExpense={permissions.canCreateExpense}
        onNewExpense={() => setDialog({ mode: 'create' })}
        onManageCategories={() => setCategoryManagerOpen(true)}
      />

      {listResource.error ? (
        <ErrorState title={t('expenses.ledger.errorLoad')} onRetry={listResource.retry} />
      ) : listResource.loading ? (
        <NeoLoading />
      ) : (
        <>
          <ExpenseLedgerList
            expenses={rows}
            categoriesByCode={categoriesByCode}
            membersById={membersLookup}
            currency={trip.currency}
            isFiltered={hasActiveFilters}
            onClearFilters={clearFilters}
            onOpen={setDetailsExpense}
          />
          {listResource.data?.next && (
            <div className="exp-load-more">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={loadMore} disabled={listResource.loadingMore}>
                {t('expenses.ledger.loadMore')}
              </button>
            </div>
          )}
        </>
      )}

      {dialog && (
        <NewExpenseDialog
          members={members}
          categories={categories}
          currentMember={currentMember}
          tripCurrency={trip.currency}
          hasFund={fund?.status === 'active'}
          expense={dialog.expense}
          onSubmit={save}
          onClose={() => setDialog(null)}
        />
      )}

      {detailsExpense && (
        <ExpenseDetailsDialog
          expense={detailsExpense}
          category={categoriesByCode[detailsExpense.category]}
          membersById={membersLookup}
          currency={trip.currency}
          canEdit={permissions.canEditExpense(detailsExpense)}
          canCreateExpense={permissions.canCreateExpense}
          onEdit={() => { setDialog({ mode: 'edit', expense: detailsExpense }); setDetailsExpense(null); }}
          onDuplicate={() => { setDialog({ mode: 'create', expense: { ...detailsExpense, duplicate: true } }); setDetailsExpense(null); }}
          onDelete={() => remove(detailsExpense)}
          onClose={() => setDetailsExpense(null)}
        />
      )}

      {categoryManagerOpen && (
        <CategoryManagerDialog
          categories={categories}
          budgets={budgets}
          currency={trip.currency}
          canManage={permissions.canManageMembers}
          onCreate={createCategoryAction}
          onUpdate={updateCategoryAction}
          onArchive={archiveCategoryAction}
          onSetBudget={setCategoryBudgetAction}
          onResetBudget={resetCategoryBudgetAction}
          onClose={() => setCategoryManagerOpen(false)}
        />
      )}
    </div>
  );
}
