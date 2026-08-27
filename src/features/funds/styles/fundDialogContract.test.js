const fs = require('fs');
const path = require('path');

/*
  Regression guard for the real browser bug this fixed: every Fund dialog
  was rendering as raw/unstyled HTML, positioned in normal document flow
  instead of a centered overlay. Root cause -- confirmed by reading the
  actual source, not by rendering -- was that ContributionActionDialog/
  FundingRoundComposer/RefundDistributionModal/ReimbursementSection's
  dialog all used classes (.bal-dialog*, .exp-modal__close,
  .exp-composer__footer, .settle-dialog__*) defined in balances.css/
  expenses.css/settlements.css, but NOTHING under the Fund route ever
  imported those stylesheets -- FundPage.jsx only ever imported its own
  fund.css. jsdom (Jest's DOM) never applies real CSS cascade/layout, so
  no amount of render-and-assert testing could ever have caught this --
  see src/styles/publicLayoutTextGuard.test.js for the same reasoning
  applied to an earlier, unrelated bug. This file reads the actual
  source text instead.
*/
const readFile = (relativePath) => fs.readFileSync(path.join(__dirname, relativePath), 'utf8');

test('fund.css defines its own self-contained dialog overlay (centered, fixed, above content)', () => {
  const css = readFile('fund.css');
  expect(css).toMatch(/\.fund-dialog-overlay\s*\{[^}]*position:\s*fixed;[^}]*\}/s);
  expect(css).toMatch(/\.fund-dialog-overlay\s*\{[^}]*inset:\s*0;[^}]*\}/s);
  expect(css).toMatch(/\.fund-dialog-overlay\s*\{[^}]*z-index:\s*var\(--z-modal\);[^}]*\}/s);
});

test('fund.css defines the .fund-dialog card shell (bordered, shadowed, scroll-safe)', () => {
  const css = readFile('fund.css');
  expect(css).toMatch(/\.fund-dialog\s*\{[^}]*border:[^}]*\}/s);
  expect(css).toMatch(/\.fund-dialog\s*\{[^}]*box-shadow:\s*var\(--shadow-hard-md\);[^}]*\}/s);
  expect(css).toMatch(/\.fund-dialog__body\s*\{[^}]*overflow-y:\s*auto;[^}]*\}/s);
  // Mobile: near/full-screen sheet under the 640px breakpoint (brief
  // requirement -- modals must never overflow/become unreachable on a
  // small viewport).
  const mobileBlock = css.match(/@media \(max-width:\s*640px\)\s*\{.*?\n\}/s)?.[0] || '';
  expect(mobileBlock).toMatch(/\.fund-dialog\s*\{[^}]*height:\s*100dvh;/s);
});

test('FundPage.jsx imports the stylesheets its dialogs\' borrowed field/button classes actually come from', () => {
  const page = readFile('../pages/FundPage.jsx');
  // .field-control/.field-group/.exp-composer__grid live in expenses.css;
  // .bal-remind-btn/.bal-empty live in balances.css. Without these two
  // imports, every Fund form field/remind-button/empty-state renders
  // completely unstyled -- exactly the reported bug.
  expect(page).toMatch(/import ['"].*expenses\/styles\/expenses\.css['"]/);
  expect(page).toMatch(/import ['"].*balances\/styles\/balances\.css['"]/);
  expect(page).toMatch(/import ['"]\.\.\/styles\/fund\.css['"]/);
});

test('no Fund dialog component regresses back to another feature\'s dialog-shell classes', () => {
  const dir = path.join(__dirname, '../components');
  const offenders = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.jsx') || file.endsWith('.test.jsx')) continue;
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    if (/\bbal-dialog(-overlay)?\b|\bexp-modal__close\b|\bsettle-dialog__/.test(source)) {
      offenders.push(file);
    }
  }
  expect(offenders).toEqual([]);
});
