import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// URL-addressable filter state for the Activity ledger -- same pattern
// as useExpenseFilters (search/filter survive back/forward nav and
// reloads via the URL itself, not local state that could drift from it).
const FIELDS = ['search', 'family'];

export default function useActivityFilters() {
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

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });
  const hasActiveFilters = FIELDS.some((field) => filters[field]);

  return { filters, setFilters, clearFilters, hasActiveFilters };
}
