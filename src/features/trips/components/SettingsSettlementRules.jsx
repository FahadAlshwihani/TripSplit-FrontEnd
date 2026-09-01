import React from 'react';
import { useTranslation } from 'react-i18next';

/*
  Settlement Rules -- both rows are deliberately non-interactive:

  "Simplify Debts" is not a real toggle anywhere in the backend --
  apps.expenses.views calls simplify_debts() unconditionally on every
  balances request, so this always-checked/disabled control is an
  honest reflection of real behavior, not a checkbox that would change
  nothing if clicked (see brief section 11).

  "Require Receipts for Settlements" has no backend at all -- no
  receipt/attachment/upload model exists anywhere in the codebase.
  Shown Coming Soon: visibly disabled, never sends a request, and is
  never included in the Save payload.

  Trip.settlement_confirmation_mode (a real, persisted field) is
  deliberately NOT surfaced here -- the supplied Stitch source has no
  control for it, and it only affects the deprecated create_settlement()
  path, not the Balances page's real two-sided settlement workflow, so
  exposing it would mislead rather than configure anything real.
*/
export default function SettingsSettlementRules() {
  const { t } = useTranslation();
  return (
    <section className="set-card" id="settlements">
      <div className="set-card__head">
        <h2 className="set-card__title">{t('settings.settlement.title')}</h2>
        <p className="set-card__subtitle">{t('settings.settlement.subtitle')}</p>
      </div>
      <div className="set-card__body">
        <div className="set-rule">
          <input type="checkbox" checked disabled aria-label={t('settings.settlement.simplifyDebts')} />
          <div className="set-rule__text">
            <span className="set-rule__label">{t('settings.settlement.simplifyDebts')}</span>
            <p className="set-rule__desc">{t('settings.settlement.simplifyDebtsDesc')}</p>
          </div>
        </div>

        <div className="set-rule set-rule--disabled">
          <input type="checkbox" disabled aria-label={t('settings.settlement.requireReceipts')} />
          <div className="set-rule__text">
            <span className="set-rule__label">
              {t('settings.settlement.requireReceipts')}
              <span className="set-soon-badge">{t('common.comingSoon')}</span>
            </span>
            <p className="set-rule__desc">{t('settings.settlement.requireReceiptsDesc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
