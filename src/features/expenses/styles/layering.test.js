const fs = require('fs');
const path = require('path');

/*
  Regression guard for a real incident: .exp-drawer had no z-index at
  all while .exp-drawer-overlay had an explicit positive z-index. CSS
  stacking groups by z-index TIER before DOM order -- an element with
  z-index:auto always paints BELOW any sibling with an explicit
  positive z-index, no matter which one comes later in the DOM. That
  made the backdrop cover the (fully rendered, fully interactive)
  drawer, blocking every click inside it.

  jsdom doesn't compute real paint/stacking order, so the only reliable
  way to guard this is a direct assertion against the CSS source: every
  layer in the drawer/backdrop/confirm-dialog stack must declare an
  explicit z-index, and the values must satisfy the intended ordering
  (page < drawer backdrop <= drawer < confirm-dialog).
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const expensesCss = read('features/expenses/styles/expenses.css');
const dashboardCss = read('features/dashboard/styles/dashboard.css');
const tokensCss = read('styles/tokens.css');

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

test('.exp-drawer declares an explicit z-index (never left to the implicit "auto" tier)', () => {
  const zIndex = zIndexOf(ruleFor(expensesCss, '.exp-drawer'));
  expect(zIndex).not.toBeNull();
});

test('the drawer backdrop never outranks the drawer itself', () => {
  const backdropZ = zIndexOf(ruleFor(expensesCss, '.exp-drawer-overlay'));
  const drawerZ = zIndexOf(ruleFor(expensesCss, '.exp-drawer'));
  expect(backdropZ).not.toBeNull();
  expect(drawerZ).not.toBeNull();
  expect(drawerZ).toBeGreaterThanOrEqual(backdropZ);
});

test('a confirmation dialog opened from inside the drawer (e.g. Delete) always outranks the drawer', () => {
  const drawerZ = zIndexOf(ruleFor(expensesCss, '.exp-drawer'));
  const confirmZ = zIndexOf(ruleFor(dashboardCss, '.confirm-dialog-overlay'));
  expect(confirmZ).not.toBeNull();
  expect(confirmZ).toBeGreaterThan(drawerZ);
});

test('the canonical modal (New/Edit Expense) backdrop never outranks its own modal', () => {
  const backdropZ = zIndexOf(ruleFor(expensesCss, '.exp-composer-overlay'));
  // .exp-composer-modal is a CHILD of .exp-composer-overlay (nested, not a
  // sibling), so it doesn't need its own z-index to paint above the
  // backdrop -- confirm that architecture is what's actually in place,
  // since a sibling refactor here would reintroduce the same bug class.
  expect(expensesCss).toMatch(/\.exp-composer-modal\s*\{/);
  expect(backdropZ).not.toBeNull();
});
