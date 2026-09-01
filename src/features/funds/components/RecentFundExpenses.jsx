import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../shared/utils/categoryPresentation';
import { formatDate } from '../../../shared/utils/format';

/*
  The 5 most recent Fund-paid expenses (server-filtered:
  GET /expenses/?payment_source=trip_fund&page_size=5) -- clicking opens
  the SAME ExpenseDetailsDrawer the Expenses Ledger uses, never a second
  expense-detail UI (view-only from here, see FundPage.jsx's comment on
  why canEdit/canCreateExpense are false).
*/
const RecentFundExpenses = ({ expenses, categoriesByCode, currency, onOpen }) => {
  const { t } = useTranslation();
  // In-app navigation link -- uses the trip's own short_code (the
  // canonical browser-URL form), never the outlet context's own
  // `tripId` (deliberately the UUID everywhere, for API calls only --
  // see TripLayout's own comment).
  const { trip } = useOutletContext();
  return (
    <section className="fund-section fund-section--half">
      <div className="fund-section__head-row">
        <h2 className="fund-section__title text-headline-md">{t('fund.recentExpensesTitle')}</h2>
        <a className="fund-section__link" href={`/trips/${trip.short_code}/expenses?payment_source=trip_fund`}>{t('fund.viewLedger')}</a>
      </div>
      {expenses.length === 0 ? (
        <p className="text-copy-sm fund-empty-note">{t('fund.noFundExpenses')}</p>
      ) : (
        <div className="fund-recent-expenses">
          {expenses.map((expense) => {
            const category = categoriesByCode[expense.category];
            const color = categoryColor(expense.category, category?.color);
            return (
              <button type="button" key={expense.id} className="fund-recent-expense" onClick={() => onOpen(expense)}>
                <span className="fund-recent-expense__icon" style={{ background: categoryTileColor(expense.category, category?.color), borderColor: color, color }}>
                  <i className={`bi ${categoryIconClass(category?.icon_key)}`} aria-hidden="true" />
                </span>
                <span className="fund-recent-expense__text">
                  <span className="fund-recent-expense__title text-copy">{expense.title}</span>
                  <span className="fund-recent-expense__meta text-copy-sm">{categoryLabel(t, expense.category, category?.name)} · {formatDate(expense.expense_date)}</span>
                </span>
                <Money value={expense.amount} currency={currency} variant="tabular" className="fund-recent-expense__amount" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentFundExpenses;
