import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';

// Must match expenses.css's own `@media (max-width: 640px)` breakpoint for
// .exp-filter-panel exactly -- below it, CSS alone owns the panel's
// position (a fixed bottom sheet) and this component must never compute
// or apply an inline position that could fight that rule.
const MOBILE_BREAKPOINT_QUERY = '(max-width: 640px)';
// No existing popover in this app measures its own rendered height before
// first paint (see TripMoreActionsMenu) -- this is the same single-pass,
// "good enough" estimate, sized for this panel's actual content (4 fields
// + actions row), used only to decide whether to flip above the trigger.
const ESTIMATED_PANEL_HEIGHT = 420;
const VIEWPORT_MARGIN = 12;

/*
  Category / payment source / date range -- the filters that don't fit
  as a segmented control or a search box. Portaled (ModalPortal, same as
  every other floating surface in the app) so a transformed/clipping
  ancestor can never trap it, but positioned by measuring the actual
  trigger element's rect -- the same anchoring approach already proven in
  TripMoreActionsMenu -- rather than a fixed viewport offset. That fixed
  offset was the desktop bug: the panel's old CSS (inset-block-start:56px
  on a position:fixed, inset:0 overlay) placed it at a hardcoded spot on
  the VIEWPORT, never relative to wherever the filter button actually
  rendered, so it visually detached the moment the page layout put that
  button anywhere else (RTL's inset-inline-end:0 made this land at the
  viewport's top-LEFT corner specifically). Below the mobile breakpoint,
  no position is computed at all -- CSS's own fixed-bottom-sheet rule
  keeps running exactly as before.

  Outside-click uses the established mousedown-listener pattern (see
  AccountMenu/TripMoreActionsMenu) rather than a click listener, so the
  same press that opened the popover can never also be read as the click
  that closes it.
*/
const ExpenseFilterPopover = ({ categories, filters, onApply, onClose, triggerRef }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const [position, setPosition] = useState(null); // null on mobile -- CSS owns it entirely
  const [draft, setDraft] = React.useState({
    category: filters.category || '',
    payment_source: filters.payment_source || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  useLayoutEffect(() => {
    if (window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const flipAbove = window.innerHeight - rect.bottom < ESTIMATED_PANEL_HEIGHT + VIEWPORT_MARGIN;
    const vertical = flipAbove
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 };
    const horizontal = isRtl
      ? { right: window.innerWidth - rect.right }
      : { left: rect.left };
    setPosition({ ...vertical, ...horizontal });
  }, [triggerRef]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      onClose();
      // Matches AccountMenu/TripMoreActionsMenu's established pattern --
      // only Escape returns focus to the trigger; an outside click leaves
      // focus wherever the user just clicked instead.
      triggerRef.current?.focus();
    };
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
      <form
        ref={panelRef}
        className="exp-filter-panel"
        role="dialog"
        aria-label={t('expenses.ledger.filter')}
        onSubmit={submit}
        style={position ? { position: 'fixed', ...position } : undefined}
      >
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
    </ModalPortal>
  );
};

export default ExpenseFilterPopover;
