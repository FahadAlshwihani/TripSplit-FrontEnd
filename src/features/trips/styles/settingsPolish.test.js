import fs from 'fs';
import path from 'path';

/*
  Structural guards for the Settings visual-polish pass -- these read
  the raw CSS/JSX text rather than asserting computed styles, since
  CSS imports are stubbed out in the jsdom test environment (no real
  cascade/layout to inspect). Each check targets a specific regression
  this pass fixed: the password field's leading/eye icons sharing one
  edge, Settings' outer cards missing the app-wide hard-shadow depth,
  and Bootstrap Icons creeping back into a Material-Symbols page.
*/
const settingsCss = fs.readFileSync(path.join(__dirname, 'settings.css'), 'utf8');
const accessSecurityJsx = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'SettingsAccessSecurity.jsx'),
  'utf8',
);

const ruleFor = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : '';
};

test('password field: leading icon and eye toggle use different logical anchors, never the same side', () => {
  const iconRule = ruleFor(settingsCss, '.set-password-field__icon');
  const toggleRule = ruleFor(settingsCss, '.set-password-field__toggle');
  expect(iconRule).toMatch(/inset-inline-start/);
  expect(toggleRule).toMatch(/inset-inline-end/);
  expect(iconRule).not.toMatch(/inset-inline-end/);
  expect(toggleRule).not.toMatch(/inset-inline-start/);
});

test('password field: the leading icon is decorative -- non-interactive, never intercepts pointer events', () => {
  const iconRule = ruleFor(settingsCss, '.set-password-field__icon');
  expect(iconRule).toMatch(/pointer-events:\s*none/);
});

test('password field: the input keeps padding clear of both the leading icon and the eye toggle', () => {
  const controlRule = ruleFor(settingsCss, '.set-password-field .field-control');
  expect(controlRule).toMatch(/padding-inline-start/);
  expect(controlRule).toMatch(/padding-inline-end/);
});

test('password field markup renders exactly one leading icon and one eye toggle, both Material Symbols (never Bootstrap Icons)', () => {
  expect(accessSecurityJsx).toMatch(/set-password-field__icon/);
  expect(accessSecurityJsx).toMatch(/set-password-field__toggle/);
  expect(accessSecurityJsx).toMatch(/material-symbols-outlined.*visibility/);
  expect(accessSecurityJsx).not.toMatch(/bi bi-eye/);
  expect(accessSecurityJsx).not.toMatch(/\bbi-eye-slash\b/);
});

test('the lock icon\'s positioning wrapper and its Material-Symbols glyph are separate elements, so inset-inline-start never resolves against the glyph\'s own forced-ltr direction', () => {
  expect(accessSecurityJsx).toMatch(/set-password-field__icon"[^>]*>\s*<span className="material-symbols-outlined">lock<\/span>/);
  expect(accessSecurityJsx).not.toMatch(/set-password-field__icon material-symbols-outlined/);
});

const CARD_DEPTH_SELECTORS = [
  '.set-quickjump-card',
  '.set-danger-card',
  '.set-account-card',
  '.set-preferences-card',
  '.set-card',
];

test.each(CARD_DEPTH_SELECTORS)('%s carries the canonical hard-shadow card-depth token', (selector) => {
  const rule = ruleFor(settingsCss, selector);
  expect(rule).toMatch(/box-shadow:\s*var\(--shadow-hard-md\)/);
});

test('no legacy override cancels the shared card shadow (no box-shadow: none on an outer card selector)', () => {
  CARD_DEPTH_SELECTORS.forEach((selector) => {
    const rule = ruleFor(settingsCss, selector);
    expect(rule).not.toMatch(/box-shadow:\s*none/);
  });
});

test('no new physical left/right CSS was introduced -- logical properties only', () => {
  expect(settingsCss).not.toMatch(/[^-](left|right):\s/);
  expect(settingsCss).not.toMatch(/margin-(left|right):/);
  expect(settingsCss).not.toMatch(/padding-(left|right):/);
});

// --- Settlement rule rows: restored card depth -----------------------

test('the settlement rule row (Simplify Debts / Require Receipts) carries the canonical small hard-shadow token', () => {
  const rule = ruleFor(settingsCss, '.set-rule');
  expect(rule).toMatch(/box-shadow:\s*var\(--shadow-hard-sm\)/);
});

test('no legacy override cancels the settlement row shadow', () => {
  const rule = ruleFor(settingsCss, '.set-rule');
  expect(rule).not.toMatch(/box-shadow:\s*none/);
});

test('both settlement rule rows (Simplify Debts, Require Receipts) use the .set-rule class carrying the depth token', () => {
  const settlementRulesJsx = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'SettingsSettlementRules.jsx'),
    'utf8',
  );
  const matches = settlementRulesJsx.match(/className="set-rule(?:\s[^"]*)?"/g) || [];
  expect(matches.length).toBe(2);
});

// --- Preferences controls: equal fixed geometry -----------------------

test('the Language/Theme select is fixed-size (inline-size + block-size), never content-width auto-sizing', () => {
  const rule = ruleFor(settingsCss, '.set-preferences-card__select');
  expect(rule).toMatch(/inline-size:\s*\d/);
  expect(rule).toMatch(/block-size:\s*\d/);
  expect(rule).not.toMatch(/min-height/);
  expect(rule).not.toMatch(/width:\s*auto/);
});

test('Language and Theme selects share the exact same control class (one shared geometry, not two)', () => {
  const preferencesJsx = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'SettingsPreferences.jsx'),
    'utf8',
  );
  const matches = preferencesJsx.match(/className="set-preferences-card__select"/g) || [];
  expect(matches.length).toBe(2);
});

// --- Join Policy box: restored card depth ------------------------------

test('the Join Policy container carries the canonical hard-shadow token', () => {
  const rule = ruleFor(settingsCss, '.set-join-policy');
  expect(rule).toMatch(/box-shadow:\s*var\(--shadow-hard-sm\)/);
});

test('no legacy override cancels the Join Policy container shadow', () => {
  const rule = ruleFor(settingsCss, '.set-join-policy');
  expect(rule).not.toMatch(/box-shadow:\s*none/);
});

// --- Base Currency (read-only/locked) control: restored card depth -----

test('the read-only value display (used for the locked Base Currency control) carries the canonical hard-shadow token', () => {
  const rule = ruleFor(settingsCss, '.set-readonly-value');
  expect(rule).toMatch(/box-shadow:\s*var\(--shadow-hard-sm\)/);
});

test('no legacy override cancels the read-only value shadow', () => {
  const rule = ruleFor(settingsCss, '.set-readonly-value');
  expect(rule).not.toMatch(/box-shadow:\s*none/);
});

// --- Password field: lock icon stability (paint-order fix) -------------

test('both the lock icon and the eye toggle carry an explicit z-index, so neither can be painted over by the input\'s own hover/focus stacking context', () => {
  const iconRule = ruleFor(settingsCss, '.set-password-field__icon');
  const toggleRule = ruleFor(settingsCss, '.set-password-field__toggle');
  expect(iconRule).toMatch(/z-index:\s*\d/);
  expect(toggleRule).toMatch(/z-index:\s*\d/);
});
