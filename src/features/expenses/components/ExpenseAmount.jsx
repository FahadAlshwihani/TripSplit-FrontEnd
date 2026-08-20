import React from 'react';

const ExpenseAmount = ({ expense, baseCurrency }) => {
  const isForeign = expense.original_currency && expense.original_currency !== baseCurrency;
  if (!isForeign) return <p>{expense.amount} {baseCurrency}</p>;
  return (
    <div className="expense-currency-amount">
      <p>{expense.original_amount} {expense.original_currency}</p>
      <small>≈ {expense.amount} {baseCurrency}</small>
    </div>
  );
};

export default ExpenseAmount;
