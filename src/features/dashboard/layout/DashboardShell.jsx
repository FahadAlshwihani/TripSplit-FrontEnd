import React, { useRef, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import MobileDashboardHeader from './MobileDashboardHeader';
import MobileBottomNav from './MobileBottomNav';
import DashboardMoreSheet from './DashboardMoreSheet';
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
  const moreTriggerRef = useRef(null);

  // Focus returns to the "More" button that opened the sheet once it
  // closes (by any means -- Escape, outside click, or following an
  // item), instead of silently falling back to <body>.
  const closeMore = () => {
    setMoreOpen(false);
    moreTriggerRef.current?.focus();
  };

  return (
    <div className="dash-shell">
      <DashboardSidebar trip={trip} tripId={tripId} permissions={permissions} />
      <div className="dash-shell__canvas">
        <DashboardTopBar tripId={tripId} permissions={permissions} />
        <MobileDashboardHeader trip={trip} tripId={tripId} />
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
    </div>
  );
};

export default DashboardShell;
