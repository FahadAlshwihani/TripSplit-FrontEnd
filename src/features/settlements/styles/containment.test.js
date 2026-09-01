const fs = require('fs');
const path = require('path');

/*
  Regression guard for two real incidents found via browser screenshots:

  A. The Settlement Ledger's timeline line/nodes bled onto the 7/5
     workspace column boundary. Root cause: .settle-workspace__left/
     __right are CSS Grid items with no min-width override -- a grid
     item's automatic minimum size defaults to its content's min-content
     size, so unbreakable timeline content could force the 5fr track
     wider than its assigned share, shifting the rendered boundary. The
     .settle-timeline/::before positioning itself was always correctly
     scoped (position:relative on .settle-timeline, never the page or
     workspace) -- this was a containment/sizing bug, not a positioning
     one. jsdom has no layout engine, so the only reliable guard is a
     direct assertion against the CSS source.

  B. SettlementActionDialog/SettlementTimelineDrawer rendered as inline
     page content instead of real overlays. Both already portal via
     ModalPortal -- the portal mechanism was never broken. But the
     structural CSS that makes portaled markup behave like a modal
     (position:fixed, backdrop, z-index) lives in balances.css/
     expenses.css, and neither component imported it -- settlements.css
     only ever added a cosmetic override, relying on whichever page
     happened to load first to have incidentally already loaded those
     stylesheets. Landing directly on the Settlements route skipped
     that, so the portaled markup had zero structural CSS. Fixed by
     having each component import its required stylesheet explicitly.
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const settlementsCss = read('features/settlements/styles/settlements.css');
const balancesCss = read('features/balances/styles/balances.css');
const expensesCss = read('features/expenses/styles/expenses.css');
const tokensCss = read('styles/tokens.css');
const actionDialogSource = read('features/settlements/components/SettlementActionDialog.jsx');
const timelineDrawerSource = read('features/settlements/components/SettlementTimelineDrawer.jsx');

const ruleFor = (css, selector) => {
  const escaped = selector.replace(/[.#]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\s|,)${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  if (!match) throw new Error(`No CSS rule found for ${selector}`);
  return match[1];
};

const zIndexOf = (ruleBody) => {
  const match = ruleBody.match(/z-index:\s*var\(([^)]+)\)|z-index:\s*(\d+)/);
  if (!match) return null;
  if (match[2]) return Number(match[2]);
  const tokenName = match[1].trim();
  const tokenMatch = tokensCss.match(new RegExp(`${tokenName.replace(/[()]/g, '\\$&')}:\\s*(\\d+)`));
  return tokenMatch ? Number(tokenMatch[1]) : null;
};

// --- A. Timeline containment -------------------------------------------

test('the workspace grid items guard against content-based track blowout (min-width: 0)', () => {
  expect(ruleFor(settlementsCss, '.settle-workspace__left')).toMatch(/min-width:\s*0/);
  expect(ruleFor(settlementsCss, '.settle-workspace__right')).toMatch(/min-width:\s*0/);
});

test('the Ledger card itself is a positioned, sizing-safe container', () => {
  const rule = ruleFor(settlementsCss, '.settle-card');
  expect(rule).toMatch(/position:\s*relative/);
  expect(rule).toMatch(/min-width:\s*0/);
});

test('the timeline root is positioned relative to itself, not the workspace or page', () => {
  const rule = ruleFor(settlementsCss, '.settle-timeline');
  expect(rule).toMatch(/position:\s*relative/);
  expect(rule).toMatch(/width:\s*100%/);
  expect(rule).toMatch(/min-width:\s*0/);
  // No center-line rule attached at the workspace or page level -- it
  // must only ever exist scoped under .settle-timeline.
  expect(settlementsCss).not.toMatch(/\.settle-workspace::before/);
  expect(settlementsCss).not.toMatch(/\.settle-page::before/);
});

test('the timeline entry card cannot grow past its 50% share via flexbox min-content override', () => {
  const rule = ruleFor(settlementsCss, '.settle-timeline-entry__card');
  expect(rule).toMatch(/min-width:\s*0/);
});

// --- B. Modal/drawer structural CSS -------------------------------------

test('the action dialog backdrop is a real fixed-position overlay above modal-backdrop tier', () => {
  const rule = ruleFor(balancesCss, '.bal-dialog-overlay');
  expect(rule).toMatch(/position:\s*fixed/);
  expect(zIndexOf(rule)).toBeGreaterThanOrEqual(1000);
});

test('the timeline drawer backdrop is a real fixed-position overlay, and the drawer itself outranks it', () => {
  const backdropRule = ruleFor(expensesCss, '.exp-drawer-overlay');
  const drawerRule = ruleFor(expensesCss, '.exp-drawer');
  expect(backdropRule).toMatch(/position:\s*fixed/);
  expect(drawerRule).toMatch(/position:\s*fixed/);
  const backdropZ = zIndexOf(backdropRule);
  const drawerZ = zIndexOf(drawerRule);
  expect(backdropZ).not.toBeNull();
  expect(drawerZ).not.toBeNull();
  expect(drawerZ).toBeGreaterThanOrEqual(backdropZ);
});

test('SettlementActionDialog explicitly imports the stylesheets its modal shell depends on -- never left to incidental route-load order', () => {
  expect(actionDialogSource).toMatch(/import ['"].*balances\/styles\/balances\.css['"]/);
  expect(actionDialogSource).toMatch(/import ['"].*expenses\/styles\/expenses\.css['"]/);
});

test('SettlementTimelineDrawer explicitly imports the stylesheet its drawer shell depends on -- never left to incidental route-load order', () => {
  expect(timelineDrawerSource).toMatch(/import ['"].*expenses\/styles\/expenses\.css['"]/);
});
