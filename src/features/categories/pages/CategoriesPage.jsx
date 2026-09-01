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

  const run = async (action) => {
    try {
      await action();
      await state.retry();
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
          onCreate={(p) => run(() => createCategory(tripId, p))}
          onUpdate={(c, p) => run(() => updateCategory(tripId, c.id, p))}
          onArchive={(c) => run(() => archiveCategory(tripId, c.id))}
          onBudget={(c, budget) => run(() => setCategoryBudget(tripId, { category: c.code, budget, currency: trip.currency }))}
          onResetBudget={(c) => run(() => resetCategoryBudget(tripId, c.id))}
        />
      )}
    </div>
  );
}
