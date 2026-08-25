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

// The four highest-frequency destinations get their own bottom-nav slot;
// everything else (including the two footer items above) lives behind
// "More" -- keeps the bottom nav to 5 slots instead of cramming in every
// destination (explicitly called out as a mobile anti-pattern to avoid).
export const MOBILE_PRIMARY_KEYS = ['overview', 'expenses', 'fund', 'members'];

export const visibleNavItems = (items, permissions) => items.filter((item) => !item.requires || permissions?.[item.requires]);
