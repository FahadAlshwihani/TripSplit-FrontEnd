import React from 'react';
import { useTranslation } from 'react-i18next';

const FILTERS = ['all', 'active', 'created_by_me', 'joined', 'closed'];

const AccountTripFilters = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="acc-trip-filters" role="tablist" aria-label={t('account.trips.title')}>
      {FILTERS.map((filterValue) => (
        <button
          key={filterValue}
          type="button"
          role="tab"
          aria-selected={value === filterValue}
          className={`acc-trip-filters__tab${value === filterValue ? ' is-active' : ''}`}
          onClick={() => onChange(filterValue)}
        >
          {t(`account.trips.filters.${filterValue}`)}
        </button>
      ))}
    </div>
  );
};

export default AccountTripFilters;
