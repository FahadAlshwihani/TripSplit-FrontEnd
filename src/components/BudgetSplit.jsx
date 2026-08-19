// File: MultipleFiles/BudgetSplit.jsx
import React from 'react';
import '../styles/CardStyles.css';

const BudgetSplit = ({ categories, currency = 'SAR' }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="card-pc">
        <h2>Categories & Budget</h2>
        <p>No categories added yet.</p>
      </div>
    );
  }

  return (
    <div className="card-pc">
      <h2>Categories & Budget</h2>
      <div className="categories-list">
        {categories.map(cat => (
          <div key={cat.id} className="category-item">
            <h4>{cat.category}</h4>
            <p>Budget: {cat.budget} {currency}</p>
            <p>Spent: {cat.spent} {currency}</p>
            <p>Remaining: {cat.remaining} {currency}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetSplit;
