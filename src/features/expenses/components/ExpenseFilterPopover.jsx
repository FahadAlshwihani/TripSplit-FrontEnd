import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';

/*
  Category / payment source / date range -- the filters that don't fit
  as a segmented control or a search box. Portaled (same architecture as
  DashboardMoreSheet/TripMoreActionsMenu) so a transformed pressable
  ancestor can never trap or clip it. Outside-click uses the established
  mousedown-listener pattern (see AccountMenu/TripMoreActionsMenu) rather
  than a click listener, so the same press that opened the popover can
  never also be read as the click that closes it.
*/
const ExpenseFilterPopover = ({ categories, filters, onApply, onClose, triggerRef }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const [draft, setDraft] = React.useState({
    category: filters.category || '',
    payment_source: filters.payment_source || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      onClose();
    };
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, triggerRef]);

  const submit = (event) => {
    event.preventDefault();
    onApply(draft);
    onClose();
  };

  const clear = () => {
    setDraft({ category: '', payment_source: '', date_from: '', date_to: '' });
    onApply({ category: '', payment_source: '', date_from: '', date_to: '' });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="exp-filter-overlay" role="presentation">
        <form ref={panelRef} className="exp-filter-panel" role="dialog" aria-label={t('expenses.ledger.filter')} onSubmit={submit}>
          <div className="exp-filter-field">
            <label className="exp-filter-field__label" htmlFor="exp-filter-category">{t('expenses.ledger.filterCategory')}</label>
            <select id="exp-filter-category" className="exp-filter-field__control" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
              <option value="">{t('expenses.ledger.filterAll')}</option>
              {categories.map((category) => <option key={category.id} value={category.code}>{category.name}</option>)}
            </select>
          </div>
          <div className="exp-filter-field">
            <label className="exp-filter-field__label" htmlFor="exp-filter-source">{t('expenses.ledger.filterPaymentSource')}</label>
            <select id="exp-filter-source" className="exp-filter-field__control" value={draft.payment_source} onChange={(event) => setDraft({ ...draft, payment_source: event.target.value })}>
              <option value="">{t('expenses.ledger.filterAll')}</option>
              <option value="trip_fund">{t('expenses.ledger.tripFund')}</option>
              <option value="personal">{t('expense.personalPayment')}</option>
            </select>
          </div>
          <div className="exp-filter-row">
            <div className="exp-filter-field">
              <label className="exp-filter-field__label" htmlFor="exp-filter-from">{t('expenses.ledger.filterDateFrom')}</label>
              <input id="exp-filter-from" type="date" className="exp-filter-field__control" value={draft.date_from} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} />
            </div>
            <div className="exp-filter-field">
              <label className="exp-filter-field__label" htmlFor="exp-filter-to">{t('expenses.ledger.filterDateTo')}</label>
              <input id="exp-filter-to" type="date" className="exp-filter-field__control" value={draft.date_to} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} />
            </div>
          </div>
          <div className="exp-filter-actions">
            <button type="button" className="exp-text-link" onClick={clear}>{t('expenses.ledger.clearFilters')}</button>
            <button type="submit" className="dash-btn dash-btn--primary">{t('expenses.ledger.applyFilters')}</button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default ExpenseFilterPopover;
