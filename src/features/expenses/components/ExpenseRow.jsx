import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../shared/utils/categoryPresentation';
import { formatDate } from '../../../shared/utils/format';
import { paymentSummary, splitSummary } from '../utils/expensePresentation';

const ExpenseRow = ({ expense, category, membersById, currency, onOpen }) => {
  const { t } = useTranslation();
  const payment = paymentSummary(expense, membersById);
  const split = splitSummary(expense);
  const isForeign = expense.original_currency && expense.original_currency !== currency;
  const chipColor = categoryColor(expense.category);
  const chipTile = categoryTileColor(expense.category);

  return (
    <div className="exp-ledger__row" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
      <div className="exp-ledger__desc">
        <span className="exp-ledger__title">{expense.title}</span>
        <span className="exp-ledger__date">{formatDate(expense.expense_date)}</span>
      </div>

      <span className="exp-category-chip" style={{ background: chipTile, borderColor: chipColor, color: chipColor }}>
        <i className={`bi ${categoryIconClass(category?.icon_key)}`} aria-hidden="true" />
        {categoryLabel(t, expense.category, category?.name || expense.category)}
      </span>

      <div className="exp-ledger__payment">
        {payment.type === 'trip_fund' && <span className="exp-ledger__payment-label exp-ledger__payment-label--fund">{t('expenses.ledger.tripFund')}</span>}
        {payment.type === 'single' && (
          <>
            {payment.member && <Avatar className="exp-ledger__payment-avatar" avatarKey={avatarKeyFromAvatar(payment.member.avatar)} displayName={payment.member.display_name} size="sm" />}
            <span className="exp-ledger__payment-label">{t('expenses.ledger.paidBy', { name: payment.member?.display_name || t('expenses.ledger.formerMember') })}</span>
          </>
        )}
        {payment.type === 'multiple' && (
          <span className="exp-ledger__payment-label">{t('expenses.ledger.paidByMembers', { count: payment.count })}</span>
        )}
      </div>

      <div className="exp-ledger__split">
        {split.scope === 'personal' ? (
          <span className="exp-ledger__split-scope">{t('expenses.ledger.filterPersonal')}</span>
        ) : (
          <>
            <span className="exp-ledger__split-scope">{t('expenses.ledger.filterShared')} • {t(`split.${split.splitType}`)}</span>
            <span className="exp-ledger__split-count">{t('expenses.ledger.members', { count: split.participantCount })}</span>
          </>
        )}
      </div>

      <div className="exp-ledger__amount">
        <Money value={isForeign ? expense.original_amount : expense.amount} currency={isForeign ? expense.original_currency : currency} variant="tabular" className="exp-ledger__amount-value text-financial" />
        {isForeign && <span className="exp-ledger__amount-converted">≈ <Money value={expense.amount} currency={currency} variant="tabular" /></span>}
      </div>
    </div>
  );
};

export default ExpenseRow;
