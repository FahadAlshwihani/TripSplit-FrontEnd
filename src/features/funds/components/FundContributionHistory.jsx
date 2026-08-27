import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

/*
  Every contribution ever recorded/reported, confirmed or not -- the
  permanent audit trail. Only a CONFIRMED, non-voided row can be
  corrected/voided (apps.funds.services enforces this server-side too);
  pending/rejected rows are resolved via the round card's review actions
  instead, never amount-edited here.
*/
const FundContributionHistory = ({ contributions, currency, canManage, onCorrect, onVoid }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null); // { id, amount } | null
  const [voiding, setVoiding] = useState(null); // { id, reason } | null

  if (contributions.length === 0) return null;

  const submitCorrect = (row) => {
    onCorrect(row, { amount: editing.amount, reason: t('fund.correctedViaHistory') });
    setEditing(null);
  };
  const submitVoid = (row) => {
    onVoid(row, voiding.reason);
    setVoiding(null);
  };

  return (
    <section className="fund-section">
      <h2 className="fund-section__title text-headline-md">{t('fund.contributionHistory')}</h2>
      <div className="fund-history-list">
        {contributions.map((row) => (
          <div className="fund-history-row" key={row.id}>
            <div className="fund-history-row__main">
              <span className="fund-history-row__title text-copy">{row.display_name} — {row.round_title}</span>
              <span className="fund-history-row__meta text-copy-sm">
                {formatDate(row.contribution_date)} · {t(`fund.status.${row.voided ? 'voided' : row.status}`)}
                {row.origin === 'member_reported' && ` · ${t('fund.originReported')}`}
              </span>
            </div>
            <Money value={row.amount} currency={currency} variant="tabular" className="fund-history-row__amount" />
            {canManage && row.status === 'confirmed' && !row.voided && (
              <div className="fund-history-row__actions">
                <button type="button" className="bal-remind-btn" aria-label={t('fund.correct')} title={t('fund.correct')} onClick={() => setEditing({ id: row.id, amount: row.amount })}><i className="bi bi-pencil" aria-hidden="true" /></button>
                <button type="button" className="bal-remind-btn" aria-label={t('fund.void')} title={t('fund.void')} onClick={() => setVoiding({ id: row.id, reason: '' })}><i className="bi bi-trash" aria-hidden="true" /></button>
              </div>
            )}
            {editing?.id === row.id && (
              <div className="fund-reject-inline">
                <label className="field-label" htmlFor={`fund-correct-${row.id}`}>{t('fund.correctAmount')}</label>
                <input id={`fund-correct-${row.id}`} type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: event.target.value })} />
                <div className="fund-reject-inline__actions">
                  <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
                  <button type="button" className="dash-btn dash-btn--primary" onClick={() => submitCorrect(row)}>{t('common.save')}</button>
                </div>
              </div>
            )}
            {voiding?.id === row.id && (
              <div className="fund-reject-inline">
                <label className="field-label" htmlFor={`fund-void-${row.id}`}>{t('fund.voidReasonLabel')}</label>
                <input id={`fund-void-${row.id}`} className="field-control" value={voiding.reason} onChange={(event) => setVoiding({ ...voiding, reason: event.target.value })} />
                <div className="fund-reject-inline__actions">
                  <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setVoiding(null)}>{t('common.cancel')}</button>
                  <button type="button" className="dash-btn dash-btn--danger" disabled={!voiding.reason.trim()} onClick={() => submitVoid(row)}>{t('fund.void')}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FundContributionHistory;
