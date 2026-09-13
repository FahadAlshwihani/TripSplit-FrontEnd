import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import usePreferenceControls from '../../account/hooks/usePreferenceControls';

const CREATE_ACTIONS = [
  { type: 'expense', labelKey: 'dashboard.quickActionsExpense', icon: 'receipt_long', capability: 'expense' },
  { type: 'member', labelKey: 'dashboard.quickActionsMember', icon: 'person_add', capability: 'member' },
  { type: 'funding-round', labelKey: 'dashboard.quickActionsFundingRound', icon: 'savings', capability: 'fundingRound' },
  { type: 'settlement', labelKey: 'dashboard.quickActionsSettlement', icon: 'fact_check', capability: 'settlement' },
];

const HELP_ACTIONS = [
  { type: 'support', labelKey: 'dashboard.quickActionsSupport', icon: 'report_problem', capability: 'support' },
];

const ACCOUNT_ACTIONS = [
  { type: 'account', labelKey: 'dashboard.quickActionsAccount', icon: 'manage_accounts', capability: 'account' },
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
  const preferences = usePreferenceControls();
  const menuRef = useRef(null);
  const fallbackTriggerRef = useRef(null);
  const resolvedTriggerRef = triggerRef || fallbackTriggerRef;
  const open = state?.type === 'menu' && state.surface === surface;
  const actionGroups = useMemo(() => [
    { id: 'create', label: t('dashboard.quickActionsGroupCreate'), actions: CREATE_ACTIONS.filter((action) => capabilities[action.capability]) },
    { id: 'help', label: t('dashboard.quickActionsGroupHelp'), actions: HELP_ACTIONS.filter((action) => capabilities[action.capability]) },
    { id: 'account', label: t('dashboard.quickActionsGroupAccount'), actions: ACCOUNT_ACTIONS.filter((action) => capabilities[action.capability]) },
  ].filter((group) => group.actions.length > 0 || group.id === 'account'), [capabilities, t]);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"], [role="menuitemradio"]')?.focus();

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
          {actionGroups.map((group) => (
            <section key={group.id} className="dash-quick-actions__group" aria-label={group.label}>
              <p className="dash-quick-actions__group-label">{group.label}</p>
              {group.actions.map((action) => (
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

              {group.id === 'account' && (
                <div className="dash-quick-actions__preferences">
                  <div className="dash-quick-actions__preference">
                    <span className="dash-quick-actions__preference-label">{t('settings.preferences.theme')}</span>
                    <div className="dash-quick-actions__choice-group" role="group" aria-label={t('settings.preferences.theme')}>
                      {['light', 'dark'].map((value) => (
                        <button
                          key={value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={preferences.theme === value}
                          className="dash-quick-actions__choice"
                          disabled={preferences.authLoading || preferences.status.preferred_theme === 'saving'}
                          onClick={() => preferences.changeTheme(value)}
                        >
                          {t(`account.preferences.theme${value === 'light' ? 'Light' : 'Dark'}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="dash-quick-actions__preference">
                    <span className="dash-quick-actions__preference-label">{t('settings.preferences.language')}</span>
                    <div className="dash-quick-actions__choice-group" role="group" aria-label={t('settings.preferences.language')}>
                      <button type="button" role="menuitemradio" aria-checked={preferences.language === 'en'} className="dash-quick-actions__choice" disabled={preferences.authLoading || preferences.status.preferred_language === 'saving'} onClick={() => preferences.changeLanguage('en')}>English</button>
                      <button type="button" role="menuitemradio" aria-checked={preferences.language === 'ar'} className="dash-quick-actions__choice" disabled={preferences.authLoading || preferences.status.preferred_language === 'saving'} onClick={() => preferences.changeLanguage('ar')}>العربية</button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
