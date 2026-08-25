import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { categoryIconClass, categoryLabel } from '../../../shared/utils/categoryPresentation';
import { formatDate } from '../../../shared/utils/format';

/*
  Built entirely from the already-loaded row object -- the list endpoint
  already returns full payments/shares per expense (see apps/expenses/
  serializers.py::ExpenseSerializer), so opening a row's details never
  needs a second network round-trip.
*/
const ExpenseDetailsDialog = ({ expense, category, membersById, currency, canEdit, canCreateExpense, onEdit, onDuplicate, onDelete, onClose }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const creator = expense.created_by ? membersById[expense.created_by] : null;
  const isForeign = expense.original_currency && expense.original_currency !== currency;

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => { dialogRef.current?.focus(); }, []);

  const shareValueFor = (row) => {
    if (expense.split_type === 'percentage' && row.percentage !== null) return `${row.percentage}%`;
    if (expense.split_type === 'shares' && row.weight !== null) return row.weight;
    return null;
  };

  return (
    <ModalPortal>
      <div className="exp-modal-overlay" role="presentation" onClick={onClose}>
        <div ref={dialogRef} tabIndex={-1} className="exp-modal" role="dialog" aria-modal="true" aria-labelledby="exp-details-title" onClick={(event) => event.stopPropagation()}>
          <div className="exp-modal__head">
            <h2 id="exp-details-title" className="exp-modal__title text-headline-sm">{expense.title}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="exp-modal__body">
            <div className="exp-detail-row">
              <span className="exp-detail-row__label">{t('expense.category')}</span>
              <span className="exp-detail-row__value"><i className={`bi ${categoryIconClass(category?.icon_key)}`} aria-hidden="true" /> {categoryLabel(t, expense.category, category?.name || expense.category)}</span>
            </div>
            <div className="exp-detail-row">
              <span className="exp-detail-row__label">{t('expense.date')}</span>
              <span className="exp-detail-row__value">{formatDate(expense.expense_date)}</span>
            </div>
            <div className="exp-detail-row">
              <span className="exp-detail-row__label">{t('expenses.ledger.columnAmount')}</span>
              <span className="exp-detail-row__value">
                <Money value={isForeign ? expense.original_amount : expense.amount} currency={isForeign ? expense.original_currency : currency} variant="tabular" />
                {isForeign && <> (≈ <Money value={expense.amount} currency={currency} variant="tabular" />)</>}
              </span>
            </div>
            {expense.payment_source === 'trip_fund' ? (
              <div className="exp-detail-row">
                <span className="exp-detail-row__label">{t('expense.payers')}</span>
                <span className="exp-detail-row__value">{t('expenses.ledger.tripFund')}</span>
              </div>
            ) : (
              <div className="exp-detail-row">
                <span className="exp-detail-row__label">{t('expense.payers')}</span>
                <div className="exp-detail-payer-list">
                  {expense.payments.map((row) => {
                    const member = membersById[row.member_id];
                    return (
                      <div className="exp-detail-payer" key={row.member_id}>
                        <span className="exp-detail-payer__who">
                          {member && <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />}
                          {member?.display_name || t('expenses.ledger.formerMember')}
                        </span>
                        <Money value={row.amount} currency={currency} variant="tabular" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="exp-detail-row">
              <span className="exp-detail-row__label">{t('expenses.ledger.columnSplit')}</span>
              <span className="exp-detail-row__value">
                {expense.scope === 'personal' ? t('expenses.ledger.filterPersonal') : `${t('expenses.ledger.filterShared')} • ${t(`split.${expense.split_type}`)}`}
              </span>
            </div>
            {expense.scope === 'shared' && (
              <div className="exp-detail-row">
                <span className="exp-detail-row__label">{t('expense.participants')}</span>
                <div className="exp-detail-payer-list">
                  {expense.shares.map((row) => {
                    const member = membersById[row.member_id];
                    const shareValue = shareValueFor(row);
                    return (
                      <div className="exp-detail-payer" key={row.member_id}>
                        <span className="exp-detail-payer__who">
                          {member && <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />}
                          {member?.display_name || t('expenses.ledger.formerMember')}
                        </span>
                        {shareValue ? <span>{shareValue}</span> : <Money value={row.amount} currency={currency} variant="tabular" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {expense.notes && (
              <div className="exp-detail-row">
                <span className="exp-detail-row__label">{t('expense.notes')}</span>
                <span className="exp-detail-row__value">{expense.notes}</span>
              </div>
            )}
            {creator && (
              <div className="exp-detail-row">
                <span className="exp-detail-row__label">{t('expenses.ledger.addedBy')}</span>
                <span className="exp-detail-row__value">{creator.display_name}</span>
              </div>
            )}
          </div>
          {(canEdit || canCreateExpense) && (
            <div className="exp-detail-actions">
              {canCreateExpense && <button type="button" className="dash-btn dash-btn--secondary" onClick={onDuplicate}>{t('expense.duplicate')}</button>}
              {canEdit && <button type="button" className="dash-btn dash-btn--secondary" onClick={onEdit}>{t('common.edit')}</button>}
              {canEdit && <button type="button" className="dash-btn dash-btn--secondary" onClick={onDelete}>{t('common.delete')}</button>}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default ExpenseDetailsDialog;
