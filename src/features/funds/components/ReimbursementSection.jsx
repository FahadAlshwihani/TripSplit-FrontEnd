import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';
import useModalDialog from '../../../shared/hooks/useModalDialog';

/*
  Reimbursements: the Fund paying a member back for something they
  personally fronted -- deliberately independent of the personal
  settlement ledger (see docs/architecture/fund-accounting.md). Candidates
  are read-only SUGGESTIONS derived from a member's positive personal
  balance; nothing here is ever auto-recorded -- an admin must explicitly
  pick one (or enter a custom amount) and submit.
*/
const ReimbursementSection = ({ reimbursements, candidates, currency, canManage, onOpen }) => {
  const { t } = useTranslation();
  return (
    <section className="fund-section fund-section--half">
      <div className="fund-section__head-row">
        <h2 className="fund-section__title text-headline-md">{t('fund.reimbursementsTitle')}</h2>
        {canManage && candidates.length > 0 && (
          <button type="button" className="dash-btn dash-btn--secondary" onClick={onOpen}>{t('fund.reimburseAction')}</button>
        )}
      </div>
      {reimbursements.length === 0 ? (
        <p className="text-copy-sm fund-empty-note">{t('fund.noReimbursements')}</p>
      ) : (
        <div className="fund-history-list">
          {reimbursements.map((row) => (
            <div className="fund-history-row" key={row.id}>
              <div className="fund-history-row__main">
                <span className="fund-history-row__title text-copy"><i className="bi bi-arrow-up-circle" aria-hidden="true" /> {t('fund.toMember', { name: row.display_name })}</span>
                {row.reason && <span className="fund-history-row__meta text-copy-sm">{row.reason} · {formatDate(row.reimbursement_date)}</span>}
              </div>
              <Money value={row.amount} currency={currency} variant="tabular" className="fund-history-row__amount" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const ReimbursementDialog = ({ candidates, members, currency, onSave, onClose }) => {
  const { t } = useTranslation();
  const [memberId, setMemberId] = useState(candidates[0]?.member_id || '');
  const [amount, setAmount] = useState(candidates[0]?.suggested_amount || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useModalDialog(onClose, { closeDisabled: submitting });

  const pickCandidate = (candidate) => {
    setMemberId(candidate.member_id);
    setAmount(candidate.suggested_amount);
  };

  const isValid = memberId && Number(amount) > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ member_id: memberId, amount, reason, idempotency_key: crypto.randomUUID() });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fund-dialog-overlay" role="presentation" onClick={() => !submitting && onClose()}>
        <form ref={dialogRef} tabIndex={-1} className="fund-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-reimburse-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="fund-dialog__head">
            <h2 id="fund-reimburse-title" className="fund-dialog__title text-headline">{t('fund.reimburseAction')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose} disabled={submitting}><i className="bi bi-x-lg" aria-hidden="true" /></button>
          </div>
          <div className="fund-dialog__body">
            {candidates.length > 0 && (
              <div className="fund-reimburse-candidates">
                <span className="field-label">{t('fund.suggestedCandidates')}</span>
                {candidates.map((candidate) => (
                  <button type="button" key={candidate.member_id} className={`fund-reimburse-candidate${memberId === candidate.member_id ? ' is-selected' : ''}`} onClick={() => pickCandidate(candidate)}>
                    <span>{candidate.display_name}</span>
                    <Money value={candidate.suggested_amount} currency={currency} variant="tabular" />
                  </button>
                ))}
              </div>
            )}
            <div className="exp-composer__grid exp-composer__grid--2">
              <div className="field-group">
                <label className="field-label" htmlFor="fund-reimburse-member">{t('fund.member')}</label>
                <select id="fund-reimburse-member" className="field-control" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
                  <option value="">—</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="fund-reimburse-amount">{t('fund.amount')}</label>
                <input id="fund-reimburse-amount" type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="fund-reimburse-reason">{t('fund.reason')}</label>
              <input id="fund-reimburse-reason" className="field-control" value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>
          <div className="fund-dialog__footer">
            <div className="fund-dialog__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('fund.reimburseAction')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

ReimbursementSection.Dialog = ReimbursementDialog;

export default ReimbursementSection;
