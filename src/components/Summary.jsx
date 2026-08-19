import React, { useEffect, useRef } from 'react';
import '../styles/CardStyles.css';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Summary = ({ expenses = [], budget, currency = 'SAR' }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  const budgetRef = useRef(null);
  const spentRef = useRef(null);
  const remainingRef = useRef(null);
  
  // Calculate values
  const parsedBudget = parseFloat(budget) || 1; // Avoid division by zero
  const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const remaining = parsedBudget - total;
  const spentPercentage = Math.min(100, (total / parsedBudget) * 100);
  
  // Animation effects
  useEffect(() => {
    const animateValue = (ref, start, end, duration = 1000) => {
      const range = end - start;
      let current = start;
      const increment = range / (duration / 16);
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        if (ref.current) {
          ref.current.textContent = Math.floor(current).toLocaleString();
        }
      }, 16);
    };

    animateValue(budgetRef, 0, parsedBudget);
    animateValue(spentRef, 0, total);
    animateValue(remainingRef, 0, remaining);
  }, [parsedBudget, total, remaining]);
  
  // Generate SVG ring for visualization
  const ProgressRing = ({ percentage, color }) => (
    <svg className="summary-ring" viewBox="0 0 36 36">
      <path
        className="ring-bg"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path
        className="ring-fill"
        stroke={color}
        strokeDasharray={`${percentage}, 100`}
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <text x="18" y="22" className="ring-text">
        {Math.round(percentage)}%
      </text>
    </svg>
  );

  return (
    <div className="summary-card">
      <div className="summary-header">
        <h2>{t('summary.card.budget.summary')}</h2> {/* Translated */}
        <div className="summary-total">
          <ProgressRing 
            percentage={spentPercentage} 
            color={spentPercentage > 90 ? '#ef4444' : '#22c55e'}
          />
        </div>
      </div>
      
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">{t('summary.card.total.budget')}</div> {/* Translated */}
          <div className="summary-value">
            <span ref={budgetRef}>0</span> {currency}
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-label">{t('summary.card.amount.spent')}</div> {/* Translated */}
          <div className={`summary-value ${total > 0 ? 'text-danger' : ''}`}>
            <span ref={spentRef}>0</span> {currency}
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-label">{t('summary.card.remaining')}</div> {/* Translated */}
          <div className={`summary-value ${
            remaining >= 0 ? 'text-success' : 'text-danger'
          }`}>
            <span ref={remainingRef}>0</span> {currency}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
