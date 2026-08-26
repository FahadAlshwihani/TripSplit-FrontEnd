import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../shared/utils/categoryPresentation';
import { formatDate } from '../../../shared/utils/format';
import { paymentSummary } from '../utils/expensePresentation';

const formatTime = (value) => (value ? new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null);

// "25% • 412.50 SAR" / "2 shares • 660.00 SAR" / plain amount for equal/exact --
// always the actual saved split intent, never a reverse-guessed percentage.
const shareDetail = (row, splitType, t) => {
  if (splitType === 'percentage' && row.percentage !== null && row.percentage !== undefined) return `${row.percentage}%`;
  if (splitType === 'shares' && row.weight !== null && row.weight !== undefined) return t('expenseComposer.shareCount', { count: Number(row.weight) });
  return null;
};

/*
  Slides from the reading-direction end (inset-inline-end, never a
  hardcoded `right`) so it flips correctly under RTL. Built entirely
  from the already-loaded expense row -- the list endpoint returns full
  payments[]/shares[] per row, so opening this never needs a second
  fetch. No `updated_by` field exists anywhere in the backend (audited
  directly against apps/expenses/models.py) -- the audit block below
  intentionally never fabricates an updater's name, only a generic,
  unattributed "last updated" note when updated_at differs from
  created_at.
*/
const ExpenseDetailsDrawer = ({ expense, category, budget, membersById, currency, canEdit, canCreateExpense, onEdit, onDuplicate, onDelete, onClose }) => {
  const { t } = useTranslation();
  const drawerRef = useRef(null);
  const returnFocusRef = useRef(null);
  const isForeign = expense.original_currency && expense.original_currency !== currency;
  const payment = paymentSummary(expense, membersById);
  const creator = expense.created_by ? membersById[expense.created_by] : null;
  const wasUpdated = expense.updated_at && expense.created_at && expense.updated_at !== expense.created_at;

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

  useEffect(() => { drawerRef.current?.focus(); }, []);

  const scopeCardValue = expense.scope === 'personal'
    ? t('expenses.ledger.filterPersonal')
    : `${t('expenses.ledger.filterShared')} • ${t(`split.${expense.split_type}`)}`;

  const sourceCardValue = payment.type === 'trip_fund'
    ? t('expenses.ledger.tripFund')
    : payment.type === 'single'
      ? t('expenses.ledger.paidBy', { name: payment.member?.display_name || t('expenses.ledger.formerMember') })
      : t('expenses.ledger.paidByMembers', { count: payment.count });

  return (
    <ModalPortal>
      <>
        <div className="exp-drawer-overlay" role="presentation" onClick={onClose} />
        <div ref={drawerRef} tabIndex={-1} className="exp-drawer" role="dialog" aria-modal="true" aria-labelledby="exp-drawer-title">
        <div className="exp-drawer__head">
          <h2 id="exp-drawer-title" className="exp-drawer__title text-headline-sm">{t('expenses.ledger.detailsTitle')}</h2>
          <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="exp-drawer__body">
          <div>
            <h3 className="exp-drawer__expense-title text-headline-sm">{expense.title}</h3>
            <div className="exp-drawer__meta">
              <span className="exp-drawer__meta-item" style={{ color: categoryColor(expense.category, category?.color) }}>
                <i className={`bi ${categoryIconClass(category?.icon_key)}`} aria-hidden="true" />
                {categoryLabel(t, expense.category, category?.name || expense.category)}
              </span>
              <span className="exp-drawer__meta-item">{formatDate(expense.expense_date)}</span>
            </div>
          </div>

          <div className="exp-drawer__bento">
            <div className="exp-drawer__bento-cell">
              <span className="exp-drawer__bento-label">{t('expenses.ledger.columnAmount')}</span>
              <span className="exp-drawer__bento-value exp-drawer__bento-value--highlight">
                <Money value={isForeign ? expense.original_amount : expense.amount} currency={isForeign ? expense.original_currency : currency} variant="tabular" />
              </span>
            </div>
            <div className="exp-drawer__bento-cell">
              <span className="exp-drawer__bento-label">{t('currency.converted')}</span>
              <span className="exp-drawer__bento-value">
                <Money value={expense.amount} currency={currency} variant="tabular" />
              </span>
            </div>
            {isForeign && (
              <div className="exp-drawer__bento-rate">
                <span>{t('currency.rate')}</span>
                <span>1 {expense.original_currency} = {expense.exchange_rate} {currency}</span>
              </div>
            )}
          </div>

          <div className="exp-drawer__cards">
            <div className="exp-drawer__card">
              <span className="exp-drawer__card-label">{t('expenseComposer.sections.payment')}</span>
              <span className="exp-drawer__card-value">{sourceCardValue}</span>
            </div>
            <div className="exp-drawer__card">
              <span className="exp-drawer__card-label">{t('expenseComposer.sections.participants')}</span>
              <span className="exp-drawer__card-value">{scopeCardValue}</span>
            </div>
          </div>

          {payment.type === 'multiple' && (
            <div className="exp-drawer__panel">
              <div className="exp-drawer__panel-head">
                <h4 className="exp-drawer__panel-title text-label">{t('expense.payers')}</h4>
                <span className="exp-drawer__panel-meta">{t('expenses.ledger.paidByMembers', { count: expense.payments.length })}</span>
              </div>
              {expense.payments.map((row) => {
                const member = membersById[row.member_id];
                return (
                  <div className="exp-drawer__panel-row" key={row.member_id}>
                    <span className="exp-drawer__panel-row-who">
                      {member && <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />}
                      {member?.display_name || t('expenses.ledger.formerMember')}
                    </span>
                    <span className="exp-drawer__panel-row-value"><Money value={row.amount} currency={currency} variant="tabular" /></span>
                  </div>
                );
              })}
              <div className="exp-drawer__panel-row exp-drawer__panel-row-total">
                <span className="exp-drawer__panel-row-who">{t('common.total')}</span>
                <span className="exp-drawer__panel-row-value"><Money value={expense.amount} currency={currency} variant="tabular" /></span>
              </div>
            </div>
          )}

          {expense.scope === 'shared' && (
            <div className="exp-drawer__panel">
              <div className="exp-drawer__panel-head">
                <h4 className="exp-drawer__panel-title text-label">{t('expenses.ledger.columnSplit')} / {t(`split.${expense.split_type}`)}</h4>
                <span className="exp-drawer__panel-meta">{t('expenses.ledger.members', { count: expense.shares.length })}</span>
              </div>
              {expense.shares.map((row) => {
                const member = membersById[row.member_id];
                const detail = shareDetail(row, expense.split_type, t);
                return (
                  <div className="exp-drawer__panel-row" key={row.member_id}>
                    <span className="exp-drawer__panel-row-who">
                      {member && <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />}
                      {member?.display_name || t('expenses.ledger.formerMember')}
                    </span>
                    <span className="exp-drawer__panel-row-value">
                      {detail && <>{detail} • </>}
                      <Money value={row.amount} currency={currency} variant="tabular" />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {budget && (
            <div className="exp-drawer__card" style={{ borderColor: categoryColor(expense.category, category?.color) }}>
              <span className="exp-drawer__card-label">{t('expenseComposer.categoryBudgetHint', { category: categoryLabel(t, expense.category, category?.name || expense.category) })}</span>
              <span className="exp-drawer__card-value" style={{ background: categoryTileColor(expense.category, category?.color) }}>
                <Money value={budget.spent} currency={currency} variant="tabular" /> {' / '} <Money value={budget.budget} currency={currency} variant="tabular" />
                {Number(budget.remaining) < 0 && <strong> {t('dashboard.overview.overBudget')}</strong>}
              </span>
            </div>
          )}

          {expense.notes && (
            <div className="exp-drawer__card">
              <span className="exp-drawer__card-label">{t('expense.notes')}</span>
              <span className="exp-drawer__card-value">{expense.notes}</span>
            </div>
          )}

          {creator && (
            <p className="exp-drawer__audit">
              <span>{t('expenses.ledger.createdBy', { name: creator.display_name })}</span>
              <span>{formatDate(expense.created_at)} · {formatTime(expense.created_at)}</span>
              {wasUpdated && <span>{t('expenses.ledger.lastUpdated')}</span>}
            </p>
          )}
        </div>

        <div className="exp-drawer__footer">
          {canEdit && <button type="button" className="dash-btn dash-btn--primary" onClick={onEdit}>{t('expense.edit')}</button>}
          <div className="exp-drawer__footer-row">
            {canCreateExpense && <button type="button" className="dash-btn dash-btn--secondary" onClick={onDuplicate}>{t('expense.duplicate')}</button>}
            {canEdit && <button type="button" className="dash-btn dash-btn--danger" onClick={onDelete}>{t('common.delete')}</button>}
          </div>
        </div>
        </div>
      </>
    </ModalPortal>
  );
};

export default ExpenseDetailsDrawer;
