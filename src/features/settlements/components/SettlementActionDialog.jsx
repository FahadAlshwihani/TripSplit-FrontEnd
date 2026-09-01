import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
// This dialog's own markup uses balances.css's `.bal-dialog*` (overlay/
// backdrop/z-index) and expenses.css's `.exp-modal__close`/`.field-*`/
// `.exp-composer__*` -- imported explicitly here, not left to whichever
// page happens to load first, so the modal renders correctly (fixed
// overlay, not inline content) even when this component is reached
// directly from the Settlements route.
import '../../balances/styles/balances.css';
import '../../expenses/styles/expenses.css';

/*
  The one rebuilt settlement-recording surface, covering all three
  two-sided-workflow actions -- never a raw From/To CRUD form. The
  member(s) the current action is contextually about are shown as real
  avatar cards, not dropdowns, EXCEPT in "admin" mode, where both parties
  are genuinely unknown up front and need real pickers.

    mode="report"   debtor "I paid"            -- counterpart is the creditor
    mode="received" creditor "Record received" -- counterpart is the debtor
    mode="admin"    owner/admin external record -- both parties picked

  Product Rule 0 (see docs/architecture/financial-ledger.md): a debtor's
  own report never moves balances by itself -- the "report" mode note
  says so explicitly and never claims the balance updates immediately;
  "received"/"admin" do update immediately, and say so.
*/
const SettlementActionDialog = ({ mode, members, currentMember, currency, counterpart, debt, initialFromId, initialToId, onSave, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(debt || '');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  // initialFromId/initialToId let a caller (the Suggested Settlements
  // card) pre-select admin mode's two pickers from a known debtor/
  // creditor pair -- optional, so every existing caller (which never
  // passes them) keeps the exact same blank-picker behavior as before.
  const [fromId, setFromId] = useState(mode === 'admin' ? (initialFromId || '') : mode === 'report' ? currentMember.id : (counterpart?.member_id || counterpart?.id || ''));
  const [toId, setToId] = useState(mode === 'admin' ? (initialToId || '') : mode === 'received' ? currentMember.id : (counterpart?.member_id || counterpart?.id || ''));
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  useEffect(() => { dialogRef.current?.focus(); }, []);

  const numericAmount = Number(amount);
  const sameMember = mode === 'admin' && fromId && fromId === toId;
  const overDebt = debt != null && numericAmount > Number(debt);
  const isValid = fromId && toId && !sameMember && numericAmount > 0 && !overDebt && settlementDate && (mode !== 'admin' || acknowledged);
  const remaining = debt != null && numericAmount > 0 ? Math.max(Number(debt) - numericAmount, 0).toFixed(2) : null;

  const title = mode === 'report' ? t('settlements.iPaidModalTitle') : mode === 'received' ? t('settlements.recordReceivedModalTitle') : t('settlements.adminModalTitle');
  const subcopy = mode === 'report' ? t('settlements.iPaidModalSubcopy', { name: counterpart?.display_name })
    : mode === 'received' ? t('settlements.recordReceivedModalSubcopy', { name: counterpart?.display_name })
    : t('settlements.adminModalSubcopy');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const base = { amount, currency, settlement_date: settlementDate, note, idempotency_key: crypto.randomUUID() };
      if (mode === 'report') await onSave({ ...base, to_member_id: toId });
      else if (mode === 'received') await onSave({ ...base, from_member_id: fromId });
      else await onSave({ ...base, from_member_id: fromId, to_member_id: toId, acknowledged: true });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="bal-dialog-overlay" role="presentation" onClick={onClose}>
        <form ref={dialogRef} tabIndex={-1} className="bal-dialog" role="dialog" aria-modal="true" aria-labelledby="settle-action-title" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
          <div className="bal-dialog__head">
            <h2 id="settle-action-title" className="bal-dialog__title text-headline">{title}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="bal-dialog__body">
            <p className="settle-dialog__subcopy">{subcopy}</p>

            {mode !== 'admin' && counterpart && (
              <div className="settle-dialog__counterpart">
                <Avatar avatarKey={avatarKeyFromAvatar(counterpart.avatar)} displayName={counterpart.display_name} size="md" />
                <div className="settle-dialog__counterpart-text">
                  <span className="settle-dialog__counterpart-name">{counterpart.display_name}</span>
                  <p className="settle-dialog__counterpart-status">{t(mode === 'report' ? 'settlements.counterpartStatusOwe' : 'settlements.counterpartStatusOwed', { name: counterpart.display_name })}</p>
                </div>
                {debt != null && (
                  <div className="settle-dialog__counterpart-debt-block">
                    <span className="settle-dialog__counterpart-debt-label">{t('settlements.debtBefore')}</span>
                    <Money value={debt} currency={currency} className="settle-dialog__counterpart-debt" />
                  </div>
                )}
              </div>
            )}

            {mode === 'admin' && (
              <div className="exp-composer__grid exp-composer__grid--2">
                <div className="field-group">
                  <label className="field-label" htmlFor="settle-admin-from">{t('settlements.payer')}</label>
                  <select id="settle-admin-from" className="field-control" value={fromId} onChange={(event) => setFromId(event.target.value)}>
                    <option value="">—</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="settle-admin-to">{t('settlements.recipient')}</label>
                  <select id="settle-admin-to" className="field-control" value={toId} onChange={(event) => setToId(event.target.value)}>
                    <option value="">—</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                  </select>
                </div>
              </div>
            )}
            {sameMember && <p className="field-error" role="alert">{t('settlements.errors.sameMember')}</p>}

            <span className="settle-dialog__section-label">{t('settlements.paymentDetails')}</span>
            <div className="exp-composer__grid exp-composer__grid--2">
              <div className="field-group">
                <label className="field-label" htmlFor="settle-amount">{t('expense.amount')}</label>
                <input id="settle-amount" type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="settle-date">{t('expense.date')}</label>
                <input id="settle-date" type="date" className="field-control" value={settlementDate} onChange={(event) => setSettlementDate(event.target.value)} />
              </div>
            </div>
            {overDebt && <p className="field-error" role="alert">{t('settlements.errors.exceedsDebt')}</p>}

            {debt != null && numericAmount > 0 && !overDebt && (
              <div className="settle-dialog__summary">
                <div className="settle-dialog__summary-row"><span>{t('settlements.debtBefore')}</span><Money value={debt} currency={currency} variant="tabular" /></div>
                <div className="settle-dialog__summary-row"><span>{t('settlements.thisPayment')}</span><Money value={amount} currency={currency} variant="tabular" /></div>
                <div className={`settle-dialog__summary-row settle-dialog__summary-row--total${Number(remaining) === 0 ? ' settle-dialog__summary-row--zero' : ''}`}>
                  <span>{t('settlements.remainingAfter')}</span><Money value={remaining} currency={currency} variant="tabular" />
                </div>
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="settle-note">{t('expense.notes')}</label>
              <input id="settle-note" className="field-control" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>

            {mode === 'report' && <p className="settle-dialog__note settle-dialog__note--info"><i className="bi bi-info-circle" aria-hidden="true" /> {t('settlements.balanceNoteReport', { name: counterpart?.display_name })}</p>}
            {mode === 'received' && <p className="settle-dialog__note settle-dialog__note--warn"><i className="bi bi-check-circle" aria-hidden="true" /> {t('settlements.balanceNoteReceived')}</p>}
            {mode === 'admin' && (
              <label className="settle-dialog__ack">
                <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
                <span>{t('settlements.adminAcknowledge')}</span>
              </label>
            )}

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="exp-composer__footer">
            <div className="exp-composer__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {mode === 'report' ? t('settlements.iPaid') : mode === 'received' ? t('settlements.recordReceived') : t('settlements.recordExternal')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default SettlementActionDialog;
