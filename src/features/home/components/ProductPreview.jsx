import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { buildAuthUrl } from '../../../auth/safeNext';

const DESKTOP_EXPENSES = ['expense1', 'expense2', 'expense3'];
const MOBILE_ITEMS = ['mobileItem1', 'mobileItem2', 'mobileItem3'];

const GridIcon = () => (
  <svg className="preview__eyebrow-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="8" y="0.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.55" />
    <rect x="0.5" y="8" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.55" />
    <rect x="8" y="8" width="5.5" height="5.5" rx="1" fill="currentColor" />
  </svg>
);

const FilterIcon = () => (
  <svg className="preview-list__filter-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <line x1="2" y1="4" x2="14" y2="4" />
    <line x1="4" y1="8" x2="12" y2="8" />
    <line x1="6" y1="12" x2="10" y2="12" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="preview-panel__meta-icon" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.2" />
    <line x1="1.5" y1="5.5" x2="12.5" y2="5.5" />
    <line x1="4" y1="1" x2="4" y2="3.2" />
    <line x1="10" y1="1" x2="10" y2="3.2" />
  </svg>
);

const PaidIcon = () => (
  <svg className="preview-panel__meta-icon" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" />
    <path d="M4.6 7.1l1.6 1.6 3.2-3.4" />
  </svg>
);

const PlaneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 1.5L1.5 6.8l5 1.7M14.5 1.5L8.5 14.5l-2-6M14.5 1.5L6.5 8.5" />
  </svg>
);

const BedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 13V6.5a1 1 0 011-1h4.5a1 1 0 011 1V9" />
    <path d="M8 9h5.5a1 1 0 011 1v3" />
    <rect x="1.5" y="9" width="13" height="2.5" rx="0.6" />
    <path d="M1.5 11.5V13M14.5 11.5V13" />
  </svg>
);

const ForkKnifeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 1.5v4.8a1.3 1.3 0 002.6 0V1.5M5.3 1.5v13" />
    <path d="M11.5 1.5c-1.2 0-1.8 1.4-1.8 3.2s.6 2.6 1.8 2.6M11.5 1.5v11.5" />
  </svg>
);

const EXPENSE_ICONS = { expense1: PlaneIcon, expense2: BedIcon, expense3: ForkKnifeIcon };

const ProductPreview = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const createHref = user ? '/create-trip' : buildAuthUrl('/create-trip');
  return (
    <section className="preview" id="preview" aria-labelledby="preview-eyebrow">
      <p id="preview-eyebrow" className="preview__eyebrow text-label"><GridIcon />{t('home.preview.eyebrow')}</p>

      {/* Desktop / tablet composition */}
      <div className="preview__grid preview__grid--desktop" aria-hidden={false}>
        <div className="preview__col preview__summary">
          <div className="preview__overview">
            <p className="preview-panel__label text-label">{t('home.preview.overviewLabel')}</p>
            <p className="preview-panel__title text-title">{t('home.preview.tripName')}</p>
            <p className="preview-panel__meta text-caption"><CalendarIcon />{t('home.preview.tripDates')}</p>
          </div>
          <div className="preview__cards">
            <div className="preview-card">
              <p className="preview-panel__label text-label">{t('home.preview.budgetLabel')}</p>
              <p className="preview-panel__amount text-financial-lg">$5,000.00</p>
              <div className="preview-progress"><span className="preview-progress__fill" style={{ width: '65%' }} /></div>
              <p className="preview-panel__meta text-caption">{t('home.preview.budgetUsed', { percent: 65 })}</p>
            </div>
            <div className="preview-card">
              <p className="preview-panel__label text-label">{t('home.preview.fundLabel')}</p>
              <p className="preview-panel__amount text-financial-lg">$3,250.00 / $4,000.00</p>
              <p className="preview-panel__meta text-caption"><PaidIcon />{t('home.preview.fundPaid', { count: 4, total: 5 })}</p>
            </div>
          </div>
        </div>
        <div className="preview__col preview__col--wide">
          <p className="preview-list__label text-label">{t('home.preview.expensesLabel')}<FilterIcon /></p>
          <ul className="preview-list">
            {DESKTOP_EXPENSES.map((key) => {
              const Icon = EXPENSE_ICONS[key];
              return (
                <li className="preview-list__row" key={key}>
                  <span className="preview-list__main">
                    <span className={`preview-list__icon preview-list__icon--${key}`}><Icon /></span>
                    <span className="preview-list__text">
                      <span className="preview-list__title text-copy">{t(`home.preview.${key}Title`)}</span>
                      <span className="preview-list__meta text-caption">{t(`home.preview.${key}Meta`)}</span>
                    </span>
                  </span>
                  <span className="preview-list__amount text-financial">{t(`home.preview.${key}Amount`)}</span>
                </li>
              );
            })}
            <li className="preview-list__row preview-list__row--placeholder text-caption">{t('home.preview.addExpense')}</li>
          </ul>
        </div>
      </div>

      {/* Mobile-specific compact ledger composition */}
      <div className="preview-mobile">
        <div className="preview-mobile__header">
          <span className="preview-mobile__title text-title">{t('home.preview.mobileTripName')}</span>
          <span className="preview-mobile__balance text-financial">{t('home.preview.mobileBalance')}</span>
        </div>
        <ul className="preview-mobile__list">
          {MOBILE_ITEMS.map((key) => {
            const amount = t(`home.preview.${key}Amount`);
            const isCredit = amount.trim().startsWith('+');
            return (
              <li className="preview-mobile__row" key={key}>
                <span>
                  <span className="preview-mobile__item-title text-label">{t(`home.preview.${key}Title`)}</span>
                  <span className="preview-mobile__item-meta text-caption">{t(`home.preview.${key}Meta`)}</span>
                </span>
                <span className={`preview-mobile__item-amount text-financial${isCredit ? ' preview-mobile__item-amount--credit' : ''}`}>{amount}</span>
              </li>
            );
          })}
        </ul>
        <Link className="preview-mobile__cta text-label" to={createHref}>{t('home.preview.viewDemoLedger')} →</Link>
      </div>
    </section>
  );
};

export default ProductPreview;
