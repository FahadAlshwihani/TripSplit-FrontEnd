import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  Stitch source (SUGGESTED SETTLEMENTS section): debtor name -- a
  horizontal line with a centered arrow_forward -- creditor name, then
  the amount and a compact RECORD button. `suggestions` is
  apps.expenses.balances.simplify_debts()'s own output, exposed as-is
  via GET /trips/{id}/balances/'s `suggested_settlements` array --
  never a graph recomputed in the frontend.

  The arrow's own transform is flipped under RTL (see settlements.css)
  so it keeps pointing from the debtor's position toward the creditor's
  even though the whole row's physical layout mirrors -- the sentence
  "the first person pays the second" must never read backwards just
  because the page direction changed.

  Record routes into the existing canonical SettlementActionDialog via
  onRecord(suggestion) -- this component never mutates anything itself,
  only reports which suggestion the user wants to act on. The label
  itself is capability-aware (chosen by the caller, not here) so it
  never claims a generic "Record" when "I paid" or "Record received"
  is the truer description of what the current viewer is about to do.
*/
export default function SuggestedSettlementsCard({ suggestions, currency, canRecord, recordLabel, onRecord, busyKey }) {
  const { t } = useTranslation();

  return (
    <section className="settle-card">
      <span className="settle-card__label">{t('settlements.suggestedSettlements')}</span>
      <div className="settle-card__body">
        <p className="settle-card__helper">{t('settlements.suggestedSettlementsHelper')}</p>
        {suggestions.length > 0 ? (
          <div className="settle-suggestion-list">
            {suggestions.map((suggestion) => {
              const key = `${suggestion.from_member}:${suggestion.to_member}`;
              const canRecordThis = canRecord(suggestion);
              return (
                <div className="settle-suggestion-row" key={key}>
                  <div className="settle-suggestion-row__transfer">
                    <span className="settle-suggestion-row__name">{suggestion.from_name}</span>
                    <span className="settle-suggestion-row__line">
                      <span className="material-symbols-outlined settle-suggestion-row__arrow" aria-hidden="true">arrow_forward</span>
                    </span>
                    <span className="settle-suggestion-row__name">{suggestion.to_name}</span>
                  </div>
                  <div className="settle-suggestion-row__action">
                    <Money value={suggestion.amount} currency={currency} variant="tabular" className="settle-suggestion-row__amount" />
                    {canRecordThis && (
                      <button
                        type="button"
                        className="settle-record-btn"
                        disabled={busyKey === key}
                        onClick={() => onRecord(suggestion)}
                      >
                        {recordLabel(suggestion)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="settle-card-empty">
            <p className="settle-card-empty__title">{t('settlements.suggestionsEmptyTitle')}</p>
            <p className="settle-card-empty__body">{t('settlements.suggestionsEmptyBody')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
