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

  C. The timeline's status icons sat beside their card in a horizontal
     row, which -- combined with the card's own 50%-minus-node-width
     share on the alternating desktop layout -- read as colliding with
     the 7/5 workspace boundary. Two intermediate fixes were tried and
     both over/under-corrected: first removing the shared center line
     and alternation entirely (broke the intended chronological read),
     then centering every node on one shared axis independent of its
     card's side (visually read as "one shared left/center column" or
     "sitting on the divider," never belonging to any specific card).
     The actual fix: node and card are both normal-flow children of the
     SAME per-entry box, node centered above the card via flex -- so the
     node always visually belongs to its own card. The whole entry
     (node + card together) alternates sides on desktop, carrying the
     node along with it automatically -- there is no separate axis for
     the node to be pinned to at all. The end/right side also gets a
     deliberately larger gap from the center line (2rem vs 1.5rem on
     the start/left side) so the card's small hover/press shadow never
     reads as colliding with it. This section guards that shape: the
     line stays a subtle background guide, the ENTRY (not just the
     card) alternates via nth-child, and the node has no axis/position
     independent of its own entry.
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

// --- C. Timeline: node belongs to its own entry, entry alternates -----

test('a continuous chronology line exists as a background guide, scoped to .settle-timeline itself (never the workspace/page)', () => {
  expect(settlementsCss).toMatch(/\.settle-timeline::before/);
  const rule = ruleFor(settlementsCss, '.settle-timeline::before');
  expect(rule).toMatch(/position:\s*absolute/);
  expect(rule).toMatch(/inset-block:\s*0/);
});

test('the node is a normal-flow child centered above its own card within the same entry box -- never absolutely positioned onto a separate shared axis', () => {
  const nodeRule = ruleFor(settlementsCss, '.settle-timeline-entry__node');
  expect(nodeRule).not.toMatch(/position:\s*(absolute|fixed)/);
  const entryRule = ruleFor(settlementsCss, '.settle-timeline-entry');
  expect(entryRule).toMatch(/display:\s*flex/);
  expect(entryRule).toMatch(/flex-direction:\s*column/);
  expect(entryRule).toMatch(/align-items:\s*center/);
});

test('desktop alternation applies to the whole ENTRY (node + card together), not just the card -- so the node is carried along with its own card, never left pinned to a shared axis', () => {
  expect(settlementsCss).toMatch(/\.settle-timeline-entry:nth-child\(odd\)\s*\{[^}]*width:\s*calc\(50%/);
  expect(settlementsCss).toMatch(/\.settle-timeline-entry:nth-child\(even\)\s*\{[^}]*width:\s*calc\(50%/);
  // The node/card-specific selectors from earlier iterations must be
  // gone -- alternation lives on .settle-timeline-entry itself now.
  expect(settlementsCss).not.toMatch(/nth-child\([^)]*\)\s+\.settle-timeline-entry__card/);
  expect(settlementsCss).not.toMatch(/nth-child\([^)]*\)\s+\.settle-timeline-entry__node/);
});

test('the end/right side keeps a bigger gap from the center line than the start/left side, so hover/press shadow never reads as colliding with it', () => {
  const oddWidth = settlementsCss.match(/\.settle-timeline-entry:nth-child\(odd\)\s*\{\s*width:\s*calc\(50%\s*-\s*([\d.]+)rem\)/);
  const evenWidth = settlementsCss.match(/\.settle-timeline-entry:nth-child\(even\)\s*\{\s*width:\s*calc\(50%\s*-\s*([\d.]+)rem\)/);
  expect(oddWidth).not.toBeNull();
  expect(evenWidth).not.toBeNull();
  expect(Number(evenWidth[1])).toBeGreaterThan(Number(oddWidth[1]));
});

test('the card hover/press treatment reuses the shared app-wide press tokens -- never a forked, page-specific interaction language', () => {
  const rule = ruleFor(settlementsCss, '.settle-timeline-entry__card:hover');
  expect(rule).toMatch(/var\(--press-sm-hover\)/);
  expect(rule).toMatch(/var\(--shadow-hard-sm-hover\)/);
});

test('the timeline root reserves a small horizontal buffer so a card at either edge has breathing room for its hover/press shadow', () => {
  const rule = ruleFor(settlementsCss, '.settle-timeline');
  expect(rule).toMatch(/padding-inline:\s*\d/);
});

test('RTL: every positioning/alternation rule uses logical properties, never physical left/right -- the line stays at a direction-agnostic 50%, so only which side the entry sits on needs to flip, and it flips for free', () => {
  expect(settlementsCss).not.toMatch(/\.settle-timeline-entry[^}]*\b(left|right)\s*:/);
  expect(settlementsCss).toMatch(/margin-inline-end:\s*auto/);
  expect(settlementsCss).toMatch(/margin-inline-start:\s*auto/);
});

test('a resolved-but-rejected row has a distinct secondary badge style and the drawer callout class both exist', () => {
  expect(ruleFor(settlementsCss, '.settle-timeline-badge--resolved')).toBeTruthy();
  expect(ruleFor(settlementsCss, '.settle-timeline__resolved-note')).toBeTruthy();
});
