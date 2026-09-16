import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CategoryManager from '../components/CategoryManager';
import SectionLoading from '../../../shared/components/SectionLoading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { archiveCategory, createCategory, getCategories, getCategoryBudgets, resetCategoryBudget, setCategoryBudget, updateCategory } from '../api/categoriesApi';

export default function CategoriesPage() {
  const { trip, tripId, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [actionError, setActionError] = useState(null);
  const state = useRouteResource(async (signal) => {
    const [categories, budgets] = await Promise.all([
      getCategories(tripId, { signal }),
      getCategoryBudgets(tripId, { signal }),
    ]);
    return { categories: categories.results, budgets: budgets.results, summary: budgets.summary };
  }, [tripId]);

  const run = async (action, update) => {
    try {
      const result = await action();
      if (update) state.setData((current) => (current ? update(current, result) : current));
      void state.retry();
      return result;
    } catch (e) {
      setActionError(e);
    }
  };

  const data = state.data;

  return (
    <div className="cat-page">
      {actionError && <ErrorState message={actionError.message} />}
      {!data && state.loading && <SectionLoading minHeight={320} label={t('categories.title')} />}
      {!data && state.error && <ErrorState message={state.error.message} onRetry={state.retry} />}
      {data && (
        <CategoryManager
          categories={data.categories}
          budgets={data.budgets}
          budgetSummary={data.summary}
          currency={trip.currency}
          canManage={permissions.canManageMembers}
          onCreate={(p) => run(
            () => createCategory(tripId, p),
            (current, category) => ({ ...current, categories: [...current.categories, category] }),
          )}
          onUpdate={(c, p) => run(
            () => updateCategory(tripId, c.id, p),
            (current, category) => ({ ...current, categories: current.categories.map((row) => (row.id === category.id ? category : row)) }),
          )}
          onArchive={(c) => run(
            () => archiveCategory(tripId, c.id),
            (current) => ({ ...current, categories: current.categories.filter((row) => row.id !== c.id) }),
          )}
          onBudget={(c, budget) => run(() => setCategoryBudget(tripId, { category: c.code, budget, currency: trip.currency }))}
          onResetBudget={(c) => run(() => resetCategoryBudget(tripId, c.id))}
        />
      )}
    </div>
  );
}
