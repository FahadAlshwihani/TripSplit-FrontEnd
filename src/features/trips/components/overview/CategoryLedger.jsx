import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Money from '../../../../shared/components/Money';
import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../../shared/utils/categoryPresentation';

const CategoryLedger = ({ categories, currency, totalAllocated, unallocated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // In-app navigation link -- uses the trip's own short_code (the
  // canonical browser-URL form), never the outlet context's own
  // `tripId` (deliberately the UUID everywhere, for API calls only --
  // see TripLayout's own comment).
  const { trip } = useOutletContext();
  // Category budgets are pure planning allocations of the trip's total
  // budget -- they never move Fund cash (see docs/architecture/
  // fund-accounting.md). Only shown once at least one category has a
  // real allocation, mirroring the server's own budget_set gate.
  const showAllocationSummary = totalAllocated !== null && totalAllocated !== undefined;

  return (
    <section className="ov-panel ov-panel--categories">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">{t('dashboard.overview.categoryLedger')}</h3>
        <button type="button" className="ov-link" onClick={() => navigate(`/trips/${trip.short_code}/expenses`)}>
          {t('dashboard.overview.viewDetails')}
        </button>
      </header>
      {showAllocationSummary && (
        <p className="ov-panel__subline text-copy-sm">
          {t('dashboard.overview.allocated')} <Money value={totalAllocated} currency={currency} variant="tabular" />
          {' · '}
          {t('dashboard.overview.unallocated')} <Money value={unallocated} currency={currency} variant="tabular" />
        </p>
      )}
      <div className="ov-panel__body">
        {categories.length ? categories.map((row) => {
          // A category with an allocated budget shows utilization
          // (spent/allocated) -- the actual planning question a member
          // cares about; one with no allocation falls back to its share
          // of total spending, same as before. Both are server-computed
          // (utilization_percentage/percent_of_total), never derived here.
          const hasBudget = row.allocated_budget !== null && row.allocated_budget !== undefined;
          const barPercent = Math.min(hasBudget ? row.utilization_percentage : row.percent_of_total, 100);
          const color = categoryColor(row.code, row.color);
          return (
            <div className={`ov-category${row.over_budget ? ' ov-category--over' : ''}`} key={row.code}>
              <div className="ov-category__row">
                <div className="ov-category__label">
                  <span className="ov-category__icon" style={{ background: categoryTileColor(row.code, row.color) }}>
                    <i className={`bi ${categoryIconClass(row.icon_key)}`} aria-hidden="true" />
                  </span>
                  <span className="ov-category__name">{categoryLabel(t, row.code, row.name)}</span>
                  {row.over_budget && <span className="ov-category__over-badge">{t('dashboard.overview.overBudget')}</span>}
                </div>
                <div className="ov-category__amounts">
                  <Money value={row.spent} currency={currency} variant="tabular" className="ov-category__amount text-financial" />
                  {hasBudget && (
                    <span className="ov-category__of">
                      {' / '}
                      <Money value={row.allocated_budget} currency={currency} variant="tabular" />
                    </span>
                  )}
                </div>
              </div>
              <div className="ov-category__track">
                <div className={`ov-category__fill${row.over_budget ? ' ov-category__fill--over' : ''}`} style={{ width: `${barPercent}%`, background: row.over_budget ? 'var(--color-danger)' : color }} />
              </div>
            </div>
          );
        }) : <p className="ov-empty text-copy-sm">{t('dashboard.overview.noCategorizedExpenses')}</p>}
      </div>
    </section>
  );
};

export default CategoryLedger;
