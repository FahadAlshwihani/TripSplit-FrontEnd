import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';

/*
  Records a settlement through the existing Settlement domain (same
  addSettlement() call SettlementsPanel already uses) -- this is chrome
  around that domain, not a second payment concept. Opens preselected
  when launched from a specific balance row (from/to/amount already
  known), or blank/first-suggestion otherwise.
*/
const RecordSettlementDialog = ({ members, currency, currentMember, preset, onSave, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => ({
    from_member_id: preset?.from_member_id || currentMember?.id || '',
    to_member_id: preset?.to_member_id || '',
    amount: preset?.amount || '',
    settlement_date: new Date().toISOString().slice(0, 10),
    note: '',
  }));

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => { dialogRef.current?.querySelector('select, input')?.focus(); }, []);

  const sameMember = form.from_member_id && form.from_member_id === form.to_member_id;
  const isValid = form.from_member_id && form.to_member_id && !sameMember && Number(form.amount) > 0 && form.settlement_date;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ ...form, currency, idempotency_key: crypto.randomUUID() });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="bal-dialog-overlay" role="presentation" onClick={onClose}>
        <form ref={dialogRef} className="bal-dialog" role="dialog" aria-modal="true" aria-labelledby="bal-settlement-title" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
          <div className="bal-dialog__head">
            <h2 id="bal-settlement-title" className="bal-dialog__title text-headline-sm">{t('settlements.record')}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="bal-dialog__body">
            <div className="exp-composer__grid">
              <div className="field-group">
                <label className="field-label" htmlFor="bal-settle-from">{t('settlements.from')}</label>
                <select id="bal-settle-from" className="field-control" value={form.from_member_id} onChange={(event) => setForm({ ...form, from_member_id: event.target.value })}>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="bal-settle-to">{t('settlements.to')}</label>
                <select id="bal-settle-to" className="field-control" value={form.to_member_id} onChange={(event) => setForm({ ...form, to_member_id: event.target.value })}>
                  <option value="">—</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                </select>
              </div>
            </div>
            {sameMember && <p className="field-error" role="alert">{t('settlements.errors.sameMember')}</p>}

            <div className="exp-composer__grid">
              <div className="field-group">
                <label className="field-label" htmlFor="bal-settle-amount">{t('expense.amount')}</label>
                <input id="bal-settle-amount" type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="bal-settle-date">{t('expense.date')}</label>
                <input id="bal-settle-date" type="date" className="field-control" value={form.settlement_date} onChange={(event) => setForm({ ...form, settlement_date: event.target.value })} />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="bal-settle-note">{t('expense.notes')}</label>
              <input id="bal-settle-note" className="field-control" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </div>

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="exp-composer__footer">
            <div className="exp-composer__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('settlements.record')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default RecordSettlementDialog;
