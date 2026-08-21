import React from 'react';
import { useTranslation } from 'react-i18next';

const DESKTOP_EXPENSES = ['expense1', 'expense2', 'expense3'];
const MOBILE_ITEMS = ['mobileItem1', 'mobileItem2', 'mobileItem3'];

const ProductPreview = () => {
  const { t } = useTranslation();
  return (
    <section className="preview" id="preview" aria-labelledby="preview-eyebrow">
      <p id="preview-eyebrow" className="preview__eyebrow text-label">{t('home.preview.eyebrow')}</p>

      {/* Desktop / tablet composition */}
      <div className="preview__grid preview__grid--desktop" aria-hidden={false}>
        <div className="preview__col">
          <div className="preview-panel">
            <p className="preview-panel__label text-label">{t('home.preview.overviewLabel')}</p>
            <p className="preview-panel__title text-title">{t('home.preview.tripName')}</p>
            <p className="preview-panel__meta text-caption">{t('home.preview.tripDates')}</p>
          </div>
          <div className="preview-panel">
            <p className="preview-panel__label text-label">{t('home.preview.budgetLabel')}</p>
            <p className="preview-panel__amount text-financial-lg">$5,000.00</p>
            <div className="preview-progress"><span className="preview-progress__fill" style={{ width: '65%' }} /></div>
            <p className="preview-panel__meta text-caption">{t('home.preview.budgetUsed', { percent: 65 })}</p>
          </div>
          <div className="preview-panel">
            <p className="preview-panel__label text-label">{t('home.preview.fundLabel')}</p>
            <p className="preview-panel__amount text-financial-lg">$3,250.00 / $4,000.00</p>
            <p className="preview-panel__meta text-caption">{t('home.preview.fundPaid', { count: 4, total: 5 })}</p>
          </div>
        </div>
        <div className="preview__col preview__col--wide">
          <p className="preview-list__label text-label">{t('home.preview.expensesLabel')}</p>
          <ul className="preview-list">
            {DESKTOP_EXPENSES.map((key) => (
              <li className="preview-list__row" key={key}>
                <span>
                  <span className="preview-list__title text-body">{t(`home.preview.${key}Title`)}</span>
                  <span className="preview-list__meta text-caption">{t(`home.preview.${key}Meta`)}</span>
                </span>
                <span className="preview-list__amount text-financial">{t(`home.preview.${key}Amount`)}</span>
              </li>
            ))}
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
        <a className="preview-mobile__cta text-label" href="#get-started">{t('home.preview.viewDemoLedger')} →</a>
      </div>
    </section>
  );
};

export default ProductPreview;
