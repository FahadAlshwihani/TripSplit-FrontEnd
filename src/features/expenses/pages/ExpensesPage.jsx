import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExpenseForm from '../components/ExpenseForm';
import QuickExpense from '../components/QuickExpense';
import ExpenseAmount from '../components/ExpenseAmount';
import CustomChart from '../../../components/CustomChart';
import Loading from '../../../components/Loading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { addExpense, deleteExpense, getExpenses, getPage, updateExpense } from '../api/expensesApi';
import { getCategories } from '../../categories/api/categoriesApi';
import { getMembers } from '../../members/api/membersApi';
import { getFund } from '../../funds/api/fundsApi';

const fulfilledValue = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback;

export default function ExpensesPage() {
  const { trip, tripId, currentMember, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [full, setFull] = useState(false);
  const [actionError, setActionError] = useState(null);

  const resource = useRouteResource(async (signal) => {
    const expenses = await getExpenses(tripId, { signal });
    const helpers = await Promise.allSettled([
      getCategories(tripId, { signal }),
      getMembers(tripId, { signal }),
      getFund(tripId, { signal }),
    ]);
    return {
      expenses,
      categories: fulfilledValue(helpers[0], { results: [] }).results,
      members: fulfilledValue(helpers[1], { results: [] }).results,
      fund: fulfilledValue(helpers[2], null),
      helperError: helpers.some((result) => result.status === 'rejected'),
    };
  }, [tripId]);

  const run = async (action) => {
    try {
      await action();
      setActionError(null);
      await resource.retry();
    } catch (error) {
      setActionError(error);
    }
  };

  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;

  const save = (payload) => run(async () => {
    if (editing && !editing.duplicate) await updateExpense(tripId, editing.id, payload);
    else await addExpense(tripId, { ...payload, idempotency_key: crypto.randomUUID() });
    setEditing(null);
  });
  const rows = resource.data.expenses.results;
  const loadMore = () => resource.loadMore(
    (signal) => getPage(resource.data.expenses.next, tripId, { signal }),
    (current, page) => ({
      ...current,
      expenses: { ...page, results: [...current.expenses.results, ...page.results] },
    }),
  );

  return (
    <>
      {actionError && <ErrorState message={actionError.message} />}
      {resource.data.helperError && (
        <ErrorState message={t('common.partialDataError')} onRetry={resource.retry} />
      )}
      {permissions.canCreateExpense && (
        <section className="card-pc">
          {!editing && !full ? (
            <QuickExpense
              currentMember={currentMember}
              members={resource.data.members}
              categories={resource.data.categories}
              onSubmit={save}
              onMore={() => setFull(true)}
            />
          ) : (
            <ExpenseForm
              members={resource.data.members}
              categories={resource.data.categories}
              currentMember={currentMember}
              tripCurrency={trip.currency}
              hasFund={resource.data.fund?.status === 'active'}
              expense={editing}
              onSubmit={save}
              onCancel={() => { setEditing(null); setFull(false); }}
            />
          )}
        </section>
      )}
      <section className="card-pc">
        <h2>{t('expense.history')}</h2>
        {rows.length ? rows.map((expense) => (
          <article className="expense-item" key={expense.id}>
            <div><h4>{expense.title}</h4><ExpenseAmount expense={expense} baseCurrency={trip.currency} /></div>
            <div className="row-actions">
              <button onClick={() => setEditing({ ...expense, duplicate: true })}>{t('expense.duplicate')}</button>
              {permissions.canEditExpense(expense) && (
                <>
                  <button onClick={() => setEditing(expense)}>{t('common.edit')}</button>
                  <button onClick={() => run(() => deleteExpense(tripId, expense.id))}>{t('common.delete')}</button>
                </>
              )}
            </div>
          </article>
        )) : <p>{t('expense.empty')}</p>}
        {resource.data.expenses.next && <button onClick={loadMore}>{t('common.loadMore')}</button>}
      </section>
      <section className="card-pc"><CustomChart expenses={rows} /></section>
    </>
  );
}
