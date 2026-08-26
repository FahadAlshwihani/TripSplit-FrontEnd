import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import useExpenseComposer from '../hooks/useExpenseComposer';
import ExpenseComposerDetails from './ExpenseComposerDetails';
import ExpenseComposerPayment from './ExpenseComposerPayment';
import ExpenseComposerParticipants from './ExpenseComposerParticipants';
import ExpenseComposerSplit from './ExpenseComposerSplit';

/*
  The single canonical New/Edit Expense composer -- one state machine
  (useExpenseComposer) drives all four sections for every supported
  combination (trip-fund/member-funded, single/multi-payer, shared/
  personal, equal/exact/percentage/shares, same/foreign currency,
  create/edit). `expense` with `.duplicate === true` is a duplicate-as-
  new: the hook's initialState only reads title/amount/category/scope/
  date/notes/split_type/payments/shares off it, so no id, created_by,
  created_at, or idempotency key is ever carried over -- the caller
  (ExpensesPage) generates a fresh idempotency key when this submits
  through the create path.
*/
const NewExpenseDialog = ({ members, categories, budgets, currentMember, tripCurrency, fund, expense, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isEdit = Boolean(expense) && !expense.duplicate;
  const hasFund = fund?.status === 'active';

  const composer = useExpenseComposer({ members, categories, currentMember, tripCurrency, expense, hasFund });
  const { form, fx, useManualRate, setManualRate, setField, setScope, setPaymentSource, togglePayer, setPayerAmount, toggleParticipant, selectAllParticipants, clearParticipants, setSplitValue, buildPayload, isForeign, splitVisible, baseAmount, remainingPaymentCents, splitAssigned, errors, isValid } = composer;

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { dialogRef.current?.querySelector('input, select, textarea, button')?.focus(); }, []);

  const title = isEdit ? t('expense.edit') : t('expense.addTitle');
  const subtitle = expense?.duplicate ? t('expenseComposer.duplicateSubtitle') : t('expenseComposer.subtitle');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(buildPayload());
    } catch (error) {
      setSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="exp-composer-overlay" role="presentation" onClick={onClose}>
        <form
          ref={dialogRef}
          className="exp-composer-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exp-composer-title"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="exp-composer-modal__head">
            <div>
              <h2 id="exp-composer-title" className="exp-composer-modal__title text-headline-sm">{title}</h2>
              <p className="exp-composer-modal__subtitle text-copy-sm">{subtitle}</p>
            </div>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="exp-composer-modal__body">
            <ExpenseComposerDetails form={form} fx={fx} useManualRate={useManualRate} setManualRate={setManualRate} setField={setField} errors={errors} categories={categories} budgets={budgets} tripCurrency={tripCurrency} isForeign={isForeign} baseAmount={baseAmount} />
            <ExpenseComposerPayment form={form} setPaymentSource={setPaymentSource} togglePayer={togglePayer} setPayerAmount={setPayerAmount} members={members} currentMember={currentMember} hasFund={hasFund} fund={fund} tripCurrency={tripCurrency} baseAmount={baseAmount} remainingPaymentCents={remainingPaymentCents} errors={errors} />
            <ExpenseComposerParticipants form={form} setScope={setScope} toggleParticipant={toggleParticipant} selectAllParticipants={selectAllParticipants} clearParticipants={clearParticipants} members={members} currentMember={currentMember} errors={errors} />
            {splitVisible && (
              <ExpenseComposerSplit form={form} setField={setField} setSplitValue={setSplitValue} members={members} baseAmount={baseAmount} splitAssigned={splitAssigned} errors={errors} />
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="exp-notes"><i className="bi bi-sticky exp-composer__section-icon" aria-hidden="true" />{t('expense.notes')}</label>
              <textarea id="exp-notes" className="field-control" rows={2} value={form.notes} onChange={(event) => setField({ notes: event.target.value })} />
            </div>

            {submitError && <p className="field-error" role="alert">{submitError.message || t('error.action')}</p>}
          </div>

          <div className="exp-composer__footer">
            <div className="exp-composer__footer-total">
              {t('expenses.ledger.columnAmount')}:
              <span className="exp-composer__footer-total-value"><Money value={baseAmount} currency={tripCurrency} variant="tabular" /></span>
            </div>
            <div className="exp-composer__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {isEdit ? t('expense.save') : t('expense.add')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default NewExpenseDialog;
