import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';

/*
  mode="report" -- a member's own "I paid into the Fund" (always pending
    until the holder confirms it -- the note here says so explicitly,
    same Product Rule 0 as the settlement dialog: a debtor's/reporter's
    own claim never moves the balance by itself). Defaults to, and is
    capped at, the reporter's own remaining obligation for this round.
  mode="record" -- the Fund holder/admin recording a receipt directly
    (confirmed immediately -- recording it IS the confirmation). Requires
    an explicit acknowledgement checkbox before it will submit, same
    pattern as SettlementActionDialog's admin mode -- never a one-click
    balance-affecting action.
*/
const ContributionActionDialog = ({ mode, round, members, currentMember, currency, onSave, onClose }) => {
  const { t } = useTranslation();
  const memberRow = (id) => round.statistics.members.find((row) => row.member_id === id);
  const initialRow = mode === 'report' ? memberRow(currentMember.id) : null;

  const [memberId, setMemberId] = useState(mode === 'record' ? '' : currentMember.id);
  const [amount, setAmount] = useState(initialRow ? initialRow.remaining : '');
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedRow = mode === 'report' ? initialRow : memberRow(memberId);
  const remaining = selectedRow ? Number(selectedRow.remaining) : null;
  const overRemaining = mode === 'report' && remaining != null && Number(amount) > remaining;

  const handleMemberChange = (event) => {
    const nextId = event.target.value;
    setMemberId(nextId);
    const row = memberRow(nextId);
    setAmount(row ? row.remaining : '');
  };

  const isValid = Number(amount) > 0 && contributionDate && (mode === 'report' || memberId) && !overRemaining && (mode !== 'record' || acknowledged);

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
      <div className="fund-dialog-overlay" role="presentation" onClick={onClose}>
        <form className="fund-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-contribution-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="fund-dialog__head">
            <h2 id="fund-contribution-dialog-title" className="fund-dialog__title text-headline">{mode === 'report' ? t('fund.iPaidDialogTitle') : t('fund.recordContribution')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="fund-dialog__body">
            <p className="fund-dialog__subcopy">{mode === 'report' ? t('fund.iPaidHelp') : t('fund.recordContributionHelp')}</p>
            <p className="fund-dialog__subcopy">{t('fund.contributionDialogRound', { title: round.title })}</p>

            {mode === 'record' && (
              <div className="field-group">
                <label className="field-label" htmlFor="fund-contribution-member">{t('fund.member')}</label>
                <select id="fund-contribution-member" className="field-control" value={memberId} onChange={handleMemberChange}>
                  <option value="">—</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                </select>
              </div>
            )}

            {selectedRow && (
              <div className="fund-dialog__figures">
                <span className="fund-figure">{t('fund.expected')} <Money value={selectedRow.expected} currency={currency} variant="tabular" /></span>
                {mode === 'record' && <span className="fund-figure">{t('fund.paidSoFar')} <Money value={selectedRow.paid} currency={currency} variant="tabular" /></span>}
                <span className="fund-figure">{t('fund.remaining')} <Money value={selectedRow.remaining} currency={currency} variant="tabular" /></span>
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
            {overRemaining && <p className="field-error" role="alert">{t('fund.errors.exceedsRemaining')}</p>}

            <div className="field-group">
              <label className="field-label" htmlFor="fund-contribution-note">{t('expense.notes')}</label>
              <input id="fund-contribution-note" className="field-control" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>

            {mode === 'report' && <p className="fund-dialog__note fund-dialog__note--info"><i className="bi bi-info-circle" aria-hidden="true" /> {t('fund.balanceNoteReport')}</p>}
            {mode === 'record' && (
              <>
                <p className="fund-dialog__note fund-dialog__note--warn"><i className="bi bi-check-circle" aria-hidden="true" /> {t('fund.balanceNoteRecord')}</p>
                <label className="fund-dialog__ack">
                  <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
                  <span>{t('fund.recordAcknowledge')}</span>
                </label>
              </>
            )}

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="fund-dialog__footer">
            <div className="fund-dialog__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {mode === 'report' ? t('fund.iPaidSubmit') : t('fund.record')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default ContributionActionDialog;
