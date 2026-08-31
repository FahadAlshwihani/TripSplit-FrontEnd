import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { FAMILIES } from '../utils/eventRegistry';

const SEARCH_DEBOUNCE_MS = 350;

/*
  Search + compact family filter, in that inline-logical order -- same
  debounced-URL-state recipe as Expenses' own ExpenseFilterBar (see
  useActivityFilters), reusing the shared SegmentedControl rather than a
  bespoke chip row.
*/
const ActivityToolbar = ({ filters, setFilters }) => {
  const { t } = useTranslation();
  const [searchDraft, setSearchDraft] = useState(filters.search || '');

  useEffect(() => { setSearchDraft(filters.search || ''); }, [filters.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== (filters.search || '')) setFilters({ search: searchDraft });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const familyOptions = [
    { value: '', label: t('activity.filterAll') },
    ...FAMILIES.map((family) => ({ value: family, label: t(`activity.family.${family}`) })),
  ];

  return (
    <div className="act-toolbar">
      <div className="act-toolbar__search">
        <i className="bi bi-search act-toolbar__search-icon" aria-hidden="true" />
        <label className="dash-visually-hidden" htmlFor="act-search">{t('activity.searchPlaceholder')}</label>
        <input
          id="act-search"
          type="search"
          className="act-toolbar__search-input"
          placeholder={t('activity.searchPlaceholder')}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
      </div>
      <div className="act-toolbar__families">
        <SegmentedControl
          ariaLabel={t('activity.filterAll')}
          options={familyOptions}
          value={filters.family || ''}
          onChange={(family) => setFilters({ family })}
        />
      </div>
    </div>
  );
};

export default ActivityToolbar;
