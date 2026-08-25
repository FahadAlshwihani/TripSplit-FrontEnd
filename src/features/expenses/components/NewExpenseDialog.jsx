import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import QuickExpense from './QuickExpense';
import ExpenseForm from './ExpenseForm';

/*
  Portal wrapper around the existing, unchanged QuickExpense/ExpenseForm
  -- 100% of the create/edit business logic (payment source, split
  types, currency conversion, participants) is reused verbatim; this
  component is presentation chrome only (open/close, Escape, focus),
  the same contract the brief asks for ("simply open/navigate into this
  canonical flow", "do not build a second New Expense implementation").
*/
const NewExpenseDialog = ({ members, categories, currentMember, tripCurrency, hasFund, expense, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [full, setFull] = useState(Boolean(expense));
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => { dialogRef.current?.querySelector('input, select, textarea, button')?.focus(); }, []);

  const title = expense ? (expense.duplicate ? t('expense.addTitle') : t('expense.edit')) : t('expense.addTitle');

  return (
    <ModalPortal>
      <div className="exp-modal-overlay" role="presentation" onClick={onClose}>
        <div ref={dialogRef} className="exp-modal" role="dialog" aria-modal="true" aria-labelledby="exp-new-expense-title" onClick={(event) => event.stopPropagation()}>
          <div className="exp-modal__head">
            <h2 id="exp-new-expense-title" className="exp-modal__title text-headline-sm">{title}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="exp-modal__body">
            {!expense && !full ? (
              <QuickExpense currentMember={currentMember} members={members} categories={categories} onSubmit={onSubmit} onMore={() => setFull(true)} />
            ) : (
              <ExpenseForm members={members} categories={categories} currentMember={currentMember} tripCurrency={tripCurrency} hasFund={hasFund} expense={expense} onSubmit={onSubmit} onCancel={onClose} />
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default NewExpenseDialog;
