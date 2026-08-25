import { DASHBOARD_NAV_ITEMS, DEFAULT_MOBILE_FAVORITES, resolveMobileFavorites, TRIP_IDENTITY_ICON, tripState, visibleNavItems } from './dashboardNav';

test('the default mobile favorites are exactly three, and a plain data array (not hardcoded per-component JSX)', () => {
  expect(DEFAULT_MOBILE_FAVORITES).toEqual(['overview', 'expenses', 'fund']);
  expect(Array.isArray(DEFAULT_MOBILE_FAVORITES)).toBe(true);
});

test('resolveMobileFavorites falls back to the default when no custom selection exists yet', () => {
  expect(resolveMobileFavorites(undefined)).toEqual(DEFAULT_MOBILE_FAVORITES);
  expect(resolveMobileFavorites(null)).toEqual(DEFAULT_MOBILE_FAVORITES);
  expect(resolveMobileFavorites([])).toEqual(DEFAULT_MOBILE_FAVORITES);
});

test('resolveMobileFavorites honors a future custom selection once one exists', () => {
  expect(resolveMobileFavorites(['members', 'balances', 'settlements'])).toEqual(['members', 'balances', 'settlements']);
});

test('every default favorite key is a real registered nav item', () => {
  const keys = DASHBOARD_NAV_ITEMS.map((item) => item.key);
  DEFAULT_MOBILE_FAVORITES.forEach((favoriteKey) => expect(keys).toContain(favoriteKey));
});

test('the shared trip identity icon is a travel/airplane glyph, not the generic compass it replaced', () => {
  expect(TRIP_IDENTITY_ICON).toBe('bi-airplane');
});

test('tripState reports active/closed/archived from real trip fields', () => {
  expect(tripState({ archived_at: null, lifecycle_status: 'active' }).key).toBe('active');
  expect(tripState({ archived_at: null, lifecycle_status: 'closed' }).key).toBe('closed');
  expect(tripState({ archived_at: '2026-01-01', lifecycle_status: 'active' }).key).toBe('archived');
});

test('visibleNavItems hides Governance from a member without canManageMembers', () => {
  const visible = visibleNavItems(DASHBOARD_NAV_ITEMS, { canManageMembers: false });
  expect(visible.some((item) => item.key === 'governance')).toBe(false);
});

test('visibleNavItems shows Governance to a member with canManageMembers', () => {
  const visible = visibleNavItems(DASHBOARD_NAV_ITEMS, { canManageMembers: true });
  expect(visible.some((item) => item.key === 'governance')).toBe(true);
});
