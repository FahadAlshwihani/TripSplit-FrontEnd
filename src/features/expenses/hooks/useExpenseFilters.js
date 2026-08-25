import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Every filter field the list endpoint accepts (see apps/expenses/views.py
// _filtered_expenses) -- kept as one ordered list so the derived filters
// object always builds its keys in the same order, which keeps
// useRouteResource's JSON.stringify(key) cache key stable across renders
// for the same actual filter values.
const FIELDS = ['search', 'scope', 'category', 'payment_source', 'payer', 'date_from', 'date_to'];

/*
  URL-addressable filter state for the Expenses Ledger -- back/forward
  navigation and reloads preserve the current search/filter view, per
  the brief's own "prefer making meaningful page state URL-addressable"
  requirement. Backed by react-router's useSearchParams rather than
  local state, so there is exactly one source of truth (the URL) instead
  of a local copy that could drift from it.
*/
export default function useExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = {};
    FIELDS.forEach((field) => {
      const value = searchParams.get(field);
      if (value) result[field] = value;
    });
    return result;
  }, [searchParams]);

  const setFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([field, value]) => {
      if (value) next.set(field, value); else next.delete(field);
    });
    setSearchParams(next, { replace: true });
  };

  const setFilter = (field, value) => setFilters({ [field]: value });
  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });
  const hasActiveFilters = FIELDS.some((field) => filters[field]);

  return { filters, setFilter, setFilters, clearFilters, hasActiveFilters };
}
