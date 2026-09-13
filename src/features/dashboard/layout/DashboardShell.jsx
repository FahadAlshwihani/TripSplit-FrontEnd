import React, { useCallback, useMemo, useRef, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import MobileDashboardHeader from './MobileDashboardHeader';
import MobileBottomNav from './MobileBottomNav';
import DashboardMoreSheet from './DashboardMoreSheet';
import QuickActionDialogs from '../quick-actions/QuickActionDialogs';
import { QuickActionRefreshProvider } from '../quick-actions/QuickActionRefreshContext';
import '../styles/dashboard.css';

/*
  Canonical trip-dashboard shell -- the ONE place that owns sidebar/top
  bar/mobile-nav markup. Every trip-scoped page (Overview today; Expenses/
  Balances/Fund/Members/Activity/Governance/Settlements/Settings tomorrow)
  renders as `children` here via TripLayout's <Outlet>, never re-declaring
  this chrome itself. Desktop and mobile variants both stay mounted in the
  DOM at all times (same pattern PublicNav already uses) and toggle via
  CSS breakpoints -- only the mobile "More" sheet is conditionally mounted,
  since it's an overlay, not layout chrome.
*/
const DashboardShell = ({ trip, tripId, currentMember, permissions, children }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  // null | { type: 'menu'|'expense'|'member'|'funding-round', surface: 'desktop'|'mobile' }
  // A single discriminated value guarantees the menu and an action dialog
  // can never be mounted simultaneously, nor can two action dialogs coexist.
  const [quickAction, setQuickAction] = useState(null);
  const moreTriggerRef = useRef(null);
  const desktopQuickActionRef = useRef(null);
  const mobileQuickActionRef = useRef(null);
  const quickActionRefs = useMemo(() => ({ desktop: desktopQuickActionRef, mobile: mobileQuickActionRef }), []);

  const quickActionCapabilities = useMemo(() => ({
    expense: Boolean(permissions.canCreateExpense),
    member: Boolean(trip.governance_capabilities?.can_invite),
    // FundPage's existing canonical gate for creating rounds is the
    // workspace permission helper's mutable manager capability.
    fundingRound: Boolean(permissions.canManageMembers),
  }), [permissions, trip.governance_capabilities]);

  const restoreQuickActionFocus = useCallback((surface) => {
    window.setTimeout(() => quickActionRefs[surface]?.current?.focus(), 0);
  }, [quickActionRefs]);

  const openQuickActions = useCallback((surface) => setQuickAction({ type: 'menu', surface }), []);
  const closeQuickActions = useCallback((surface, { restoreFocus = false } = {}) => {
    setQuickAction((current) => (current?.type === 'menu' && current.surface === surface ? null : current));
    if (restoreFocus) restoreQuickActionFocus(surface);
  }, [restoreQuickActionFocus]);
  const selectQuickAction = useCallback((type, surface) => setQuickAction({ type, surface }), []);
  const closeQuickActionDialog = useCallback(() => {
    const surface = quickAction?.surface;
    setQuickAction(null);
    if (surface) restoreQuickActionFocus(surface);
  }, [quickAction, restoreQuickActionFocus]);

  // Focus returns to the "More" button that opened the sheet once it
  // closes (by any means -- Escape, outside click, or following an
  // item), instead of silently falling back to <body>.
  const closeMore = () => {
    setMoreOpen(false);
    moreTriggerRef.current?.focus();
  };

  const quickActionsProps = {
    state: quickAction,
    capabilities: quickActionCapabilities,
    onOpen: openQuickActions,
    onClose: closeQuickActions,
    onSelect: selectQuickAction,
  };

  return (
    <QuickActionRefreshProvider>
      <div className="dash-shell">
        <DashboardSidebar trip={trip} tripId={tripId} permissions={permissions} />
        <div className="dash-shell__canvas">
          <DashboardTopBar trip={trip} tripId={tripId} quickActions={{ ...quickActionsProps, triggerRef: desktopQuickActionRef }} />
          <MobileDashboardHeader trip={trip} tripId={tripId} quickActions={{ ...quickActionsProps, triggerRef: mobileQuickActionRef }} />
          <main className="dash-content">{children}</main>
        </div>
        <MobileBottomNav ref={moreTriggerRef} tripId={tripId} onOpenMore={() => setMoreOpen(true)} />
        {moreOpen && (
          <DashboardMoreSheet
            tripId={tripId}
            currentMember={currentMember}
            permissions={permissions}
            onClose={closeMore}
          />
        )}
        <QuickActionDialogs
          action={quickAction}
          trip={trip}
          tripId={trip.id}
          currentMember={currentMember}
          onClose={closeQuickActionDialog}
        />
      </div>
    </QuickActionRefreshProvider>
  );
};

export default DashboardShell;
