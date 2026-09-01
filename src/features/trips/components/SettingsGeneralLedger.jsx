import React from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyPicker from '../../../shared/components/CurrencyPicker';

/*
  General Ledger -- title, dates, currency. Deliberately NO budget
  field: there is no independent "Trip budget" domain any more (see
  docs/architecture/fund-accounting.md, "The Trip Fund is the budget")
  -- the Fund target is edited only from the Fund page. Currency
  becomes read-only once `currencyLocked` (server-derived, see
  apps.trips.services.has_financial_activity) -- changing it after
  expenses/settlements exist would silently relabel historical amounts
  under the new code with no real conversion.
*/
export default function SettingsGeneralLedger({ canEdit, title, startDate, endDate, currency, currencyLocked, onChange, errors }) {
  const { t } = useTranslation();
  return (
    <section className="set-card" id="general">
      <div className="set-card__head">
        <h2 className="set-card__title">{t('settings.general.title')}</h2>
        <p className="set-card__subtitle">{t('settings.general.subtitle')}</p>
      </div>
      <div className="set-card__body">
        <div className="field-group">
          <label className="field-label" htmlFor="set-title">{t('settings.general.name')}</label>
          {canEdit ? (
            <input id="set-title" className="field-control" type="text" value={title} maxLength={200} onChange={(e) => onChange('title', e.target.value)} />
          ) : (
            <p className="set-readonly-value">{title}</p>
          )}
          {errors?.title && <p className="set-save-feedback set-save-feedback--error" role="alert">{errors.title}</p>}
        </div>

        <div className="set-row set-row--2">
          <div className="field-group">
            <label className="field-label" htmlFor="set-start-date">{t('settings.general.startDate')}</label>
            {canEdit ? (
              <input id="set-start-date" className="field-control" type="date" value={startDate || ''} onChange={(e) => onChange('start_date', e.target.value || null)} />
            ) : (
              <p className="set-readonly-value"><bdi dir="ltr">{startDate || t('settings.general.notSet')}</bdi></p>
            )}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="set-end-date">{t('settings.general.endDate')}</label>
            {canEdit ? (
              <input id="set-end-date" className="field-control" type="date" value={endDate || ''} onChange={(e) => onChange('end_date', e.target.value || null)} />
            ) : (
              <p className="set-readonly-value"><bdi dir="ltr">{endDate || t('settings.general.notSet')}</bdi></p>
            )}
          </div>
        </div>
        {errors?.end_date && <p className="set-save-feedback set-save-feedback--error" role="alert">{errors.end_date}</p>}

        <div className="set-row set-divider">
          <div className="field-group">
            <label className="field-label" htmlFor="set-currency">{t('settings.general.currency')}</label>
            {canEdit && !currencyLocked ? (
              <CurrencyPicker id="set-currency" value={currency} onChange={(code) => onChange('currency', code)} label={t('settings.general.currency')} />
            ) : (
              <p className="set-readonly-value"><bdi dir="ltr">{currency}</bdi></p>
            )}
            {currencyLocked && <p className="set-hint">{t('settings.general.currencyLockedHint')}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
