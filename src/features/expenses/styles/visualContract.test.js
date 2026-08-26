const fs = require('fs');
const path = require('path');

/*
  Static CSS-source contract checks for two visual regressions fixed in
  the FX/fund-aware composer pass. jsdom doesn't compute real flex
  layout or resolve CSS custom properties for getComputedStyle, so a
  DOM-rendered assertion can't actually prove either of these -- reading
  the CSS source directly is the reliable way to guard them.
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const segmentedControlCss = read('shared/components/SegmentedControl.css');
const expensesCss = read('features/expenses/styles/expenses.css');

test('segmented control items are equal-width flex cells, not content-sized pills with dead space around them', () => {
  const itemRule = segmentedControlCss.match(/\.seg-control__item\s*\{([^}]*)\}/)[1];
  expect(itemRule).toMatch(/flex:\s*1 1 0/);
  const trackRule = segmentedControlCss.match(/\.seg-control\s*\{([^}]*)\}/)[1];
  expect(trackRule).toMatch(/align-items:\s*stretch/);
});

test('the composer/drawer reclaim bare span/p/a/li color from the legacy App.css white-text reset', () => {
  expect(expensesCss).toMatch(/\.exp-composer-modal\s*:where\(span,\s*p,\s*a,\s*li\)/);
  expect(expensesCss).toMatch(/\.exp-drawer\s*:where\(span,\s*p,\s*a,\s*li\)/);
});
