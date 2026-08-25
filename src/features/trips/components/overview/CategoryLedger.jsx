import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../../../shared/utils/format';
import { categoryIconClass } from '../../utils/categoryIcons';

const CategoryLedger = ({ categories, currency, tripId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="ov-panel ov-panel--categories">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">{t('dashboard.overview.categoryLedger')}</h3>
        <button type="button" className="ov-link" onClick={() => navigate(`/trips/${tripId}/expenses`)}>
          {t('dashboard.overview.viewDetails')}
        </button>
      </header>
      <div className="ov-panel__body">
        {categories.length ? categories.map((row) => (
          <div className="ov-category" key={row.code}>
            <div className="ov-category__row">
              <div className="ov-category__label">
                <span className="ov-category__icon"><i className={`bi ${categoryIconClass(row.icon_key)}`} aria-hidden="true" /></span>
                <span>{row.name}</span>
              </div>
              <span className="ov-category__amount">{formatMoney(row.spent, currency)}</span>
            </div>
            <div className="ov-category__track">
              <div className="ov-category__fill" style={{ width: `${row.percent_of_total}%` }} />
            </div>
          </div>
        )) : <p className="ov-empty text-copy-sm">{t('dashboard.overview.noCategorizedExpenses')}</p>}
      </div>
    </section>
  );
};

export default CategoryLedger;
