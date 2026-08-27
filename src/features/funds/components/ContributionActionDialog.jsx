import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';

/*
  mode="report" -- a member's own "I paid into the Fund" (always pending
    until the holder confirms it -- the note here says so explicitly,
    same Product Rule 0 as the settlement dialog: a debtor's/reporter's
    own claim never moves the balance by itself).
  mode="record" -- the Fund holder/admin recording a receipt directly
    (confirmed immediately -- recording it IS the confirmation).
*/
const ContributionActionDialog = ({ mode, round, members, currentMember, currency, onSave, onClose }) => {
  const { t } = useTranslation();
  const [memberId, setMemberId] = useState(mode === 'record' ? '' : currentMember.id);
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isValid = Number(amount) > 0 && contributionDate && (mode === 'report' || memberId);

  const submit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const base = { amount, contribution_date: contributionDate, note, idempotency_key: crypto.randomUUID() };
      await onSave(mode === 'record' ? { ...base, member_id: memberId } : base);
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="bal-dialog-overlay" role="presentation" onClick={onClose}>
        <form className="bal-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-contribution-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="bal-dialog__head">
            <h2 id="fund-contribution-dialog-title" className="bal-dialog__title text-headline">{mode === 'report' ? t('fund.iPaid') : t('fund.recordContribution')}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="bal-dialog__body">
            <p className="settle-dialog__subcopy">{t('fund.contributionDialogRound', { title: round.title })}</p>

            {mode === 'record' && (
              <div className="field-group">
                <label className="field-label" htmlFor="fund-contribution-member">{t('fund.member')}</label>
                <select id="fund-contribution-member" className="field-control" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
                  <option value="">—</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                </select>
              </div>
            )}

            <div className="exp-composer__grid exp-composer__grid--2">
              <div className="field-group">
                <label className="field-label" htmlFor="fund-contribution-amount">{t('fund.amount')}</label>
                <input id="fund-contribution-amount" type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="fund-contribution-date">{t('expense.date')}</label>
                <input id="fund-contribution-date" type="date" className="field-control" value={contributionDate} onChange={(event) => setContributionDate(event.target.value)} />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="fund-contribution-note">{t('expense.notes')}</label>
              <input id="fund-contribution-note" className="field-control" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>

            {mode === 'report' && <p className="settle-dialog__note settle-dialog__note--info"><i className="bi bi-info-circle" aria-hidden="true" /> {t('fund.balanceNoteReport')}</p>}
            {mode === 'record' && <p className="settle-dialog__note settle-dialog__note--warn"><i className="bi bi-check-circle" aria-hidden="true" /> {t('fund.balanceNoteRecord')}</p>}

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="exp-composer__footer">
            <div className="exp-composer__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {mode === 'report' ? t('fund.iPaid') : t('fund.record')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default ContributionActionDialog;
