/*
  Single source of truth for the trip-dashboard navigation set, consumed
  by DashboardSidebar (desktop), MobileBottomNav, and DashboardMoreSheet
  (mobile) -- so the nav order/icons/labels/role-gating are defined once
  instead of copy-pasted into three components. `requires` names a key on
  the trip-workspace `permissions` object (see shared/utils/permissions.js);
  omit it for anything every active member can see.
*/
export const DASHBOARD_NAV_ITEMS = [
  { key: 'overview', path: 'overview', icon: 'bi-grid-1x2', labelKey: 'dashboard.nav.overview' },
  { key: 'expenses', path: 'expenses', icon: 'bi-receipt', labelKey: 'dashboard.nav.expenses' },
  { key: 'balances', path: 'balances', icon: 'bi-wallet2', labelKey: 'dashboard.nav.balances' },
  { key: 'fund', path: 'fund', icon: 'bi-piggy-bank', labelKey: 'dashboard.nav.fund' },
  { key: 'members', path: 'members', icon: 'bi-people', labelKey: 'dashboard.nav.members' },
  { key: 'activity', path: 'activity', icon: 'bi-clock-history', labelKey: 'dashboard.nav.activity' },
  { key: 'governance', path: 'governance', icon: 'bi-shield-check', labelKey: 'dashboard.nav.governance', requires: 'canManageMembers' },
  { key: 'settlements', path: 'settlements', icon: 'bi-arrow-left-right', labelKey: 'dashboard.nav.settlements' },
];

export const DASHBOARD_FOOTER_ITEMS = [
  { key: 'settings', path: 'settings', icon: 'bi-gear', labelKey: 'dashboard.nav.settings' },
  { key: 'support', path: 'support', icon: 'bi-question-circle', labelKey: 'dashboard.nav.support' },
];

// Exactly three favorites get their own bottom-nav slot, plus "More" --
// four slots total, not every destination crammed in (an explicit
// mobile anti-pattern). A plain array (not three hardcoded JSX blocks)
// so a future Settings screen can let a member pick their own 3 without
// touching MobileBottomNav/DashboardMoreSheet -- both already derive
// their contents from whatever list they're given.
export const DEFAULT_MOBILE_FAVORITES = ['overview', 'expenses', 'fund'];

// Resolves the favorites to actually render: a member's saved choice if
// one exists (not implemented yet -- no Settings UI for it in this
// pass), otherwise the default three. Centralizing the fallback here
// means the future customization feature only has to supply
// `customFavorites` and never has to know this default.
export const resolveMobileFavorites = (customFavorites) => (
  Array.isArray(customFavorites) && customFavorites.length ? customFavorites : DEFAULT_MOBILE_FAVORITES
);

export const visibleNavItems = (items, permissions) => items.filter((item) => !item.requires || permissions?.[item.requires]);

// The travel/airplane identity icon shared by the desktop sidebar and
// mobile header -- one place so both surfaces can never quietly drift
// to different icons for the same trip.
export const TRIP_IDENTITY_ICON = 'bi-airplane';

// Shared trip lifecycle -> badge mapping (desktop sidebar + mobile
// header both show the same badge for the same trip).
export const tripState = (trip) => {
  if (trip.archived_at) return { key: 'archived', label: 'dashboard.trip.state.archived' };
  if (trip.lifecycle_status === 'closed') return { key: 'closed', label: 'dashboard.trip.state.closed' };
  return { key: 'active', label: 'dashboard.trip.state.active' };
};
