import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ACTIONS = [
  { type: 'expense', labelKey: 'dashboard.quickActionsExpense', icon: 'receipt_long', capability: 'expense' },
  { type: 'member', labelKey: 'dashboard.quickActionsMember', icon: 'person_add', capability: 'member' },
  { type: 'funding-round', labelKey: 'dashboard.quickActionsFundingRound', icon: 'savings', capability: 'fundingRound' },
];

/*
  One launcher/menu implementation is rendered in both dashboard headers;
  DashboardShell owns the single discriminated state, so only the active
  surface can render a menu and only one action dialog can follow it.
  The menu is a popover, not a modal: action selection unmounts it before
  the canonical portaled composer mounts.
*/
export default function QuickActionsMenu({
  surface,
  state,
  triggerRef,
  capabilities = {},
  onOpen,
  onClose,
  onSelect,
}) {
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const fallbackTriggerRef = useRef(null);
  const resolvedTriggerRef = triggerRef || fallbackTriggerRef;
  const open = state?.type === 'menu' && state.surface === surface;
  const availableActions = useMemo(
    () => ACTIONS.filter((action) => capabilities[action.capability]),
    [capabilities],
  );

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(surface, { restoreFocus: true });
      }
    };
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target) && !resolvedTriggerRef.current?.contains(event.target)) {
        onClose(surface, { restoreFocus: false });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose, surface, resolvedTriggerRef]);

  if (availableActions.length === 0) return null;

  const menuId = `dashboard-quick-actions-${surface}`;
  return (
    <div className={`dash-quick-actions dash-quick-actions--${surface}`}>
      <button
        ref={resolvedTriggerRef}
        type="button"
        className="dash-btn dash-btn--primary dash-quick-actions__trigger"
        aria-label={t('dashboard.quickActions')}
        title={t('dashboard.quickActions')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? onClose(surface, { restoreFocus: true }) : onOpen(surface))}
      >
        <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
        <span className="dash-btn__label" aria-hidden="true">{t('dashboard.quickActions')}</span>
      </button>

      {open && (
        <div ref={menuRef} id={menuId} className="dash-quick-actions__menu" role="menu" aria-label={t('dashboard.quickActions')}>
          {availableActions.map((action) => (
            <button
              key={action.type}
              type="button"
              className="dash-quick-actions__item"
              role="menuitem"
              onClick={() => onSelect(action.type, surface)}
            >
              <span className="dash-quick-actions__icon" aria-hidden="true">
                <span className="material-symbols-outlined">{action.icon}</span>
              </span>
              <span>{t(action.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
