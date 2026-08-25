import React from 'react';
import { useTranslation } from 'react-i18next';
import ExpenseRow from './ExpenseRow';

const ExpenseLedgerList = ({ expenses, categoriesByCode, membersById, currency, onOpen, isFiltered, onClearFilters }) => {
  const { t } = useTranslation();

  if (!expenses.length) {
    return (
      <div className="exp-ledger">
        <div className="exp-empty">
          <i className={`bi ${isFiltered ? 'bi-search' : 'bi-receipt'} exp-empty__icon`} aria-hidden="true" />
          <p className="exp-empty__title text-headline-sm">{isFiltered ? t('expenses.ledger.emptyFiltered') : t('expenses.ledger.emptyTitle')}</p>
          {!isFiltered && <p className="exp-empty__body text-copy-sm">{t('expenses.ledger.emptyBody')}</p>}
          {isFiltered && <button type="button" className="exp-text-link" onClick={onClearFilters}>{t('expenses.ledger.clearFilters')}</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="exp-ledger">
      <div className="exp-ledger__head" aria-hidden="true">
        <span className="exp-ledger__head-cell">{t('expenses.ledger.columnDescription')}</span>
        <span className="exp-ledger__head-cell">{t('expenses.ledger.columnCategory')}</span>
        <span className="exp-ledger__head-cell">{t('expenses.ledger.columnPayment')}</span>
        <span className="exp-ledger__head-cell">{t('expenses.ledger.columnSplit')}</span>
        <span className="exp-ledger__head-cell exp-ledger__head-cell--end">{t('expenses.ledger.columnAmount')}</span>
      </div>
      {expenses.map((expense) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          category={categoriesByCode[expense.category]}
          membersById={membersById}
          currency={currency}
          onOpen={() => onOpen(expense)}
        />
      ))}
    </div>
  );
};

export default ExpenseLedgerList;
