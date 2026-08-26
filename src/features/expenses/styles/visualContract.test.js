const fs = require('fs');
const path = require('path');

/*
  Static CSS-source contract checks for two visual regressions fixed in
  the FX/fund-aware composer pass. jsdom doesn't compute real flex
  layout or resolve CSS custom properties for getComputedStyle, so a
  DOM-rendered assertion can't actually prove either of these -- reading
  the CSS source directly is the reliable way to guard them.
*/

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const read = (relativePath) => stripComments(fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8'));

const segmentedControlCss = read('shared/components/SegmentedControl.css');
const expensesCss = read('features/expenses/styles/expenses.css');

test('segmented control items are equal-width flex cells, not content-sized pills with dead space around them', () => {
  const itemRule = segmentedControlCss.match(/\.seg-control__item\s*\{([^}]*)\}/)[1];
  expect(itemRule).toMatch(/flex:\s*1 1 0/);
  expect(itemRule).toMatch(/align-self:\s*stretch/);
  const trackRule = segmentedControlCss.match(/\.seg-control\s*\{([^}]*)\}/)[1];
  expect(trackRule).toMatch(/align-items:\s*stretch/);
});

test('the track carries no padding/gap and items carry no border-radius/margin, so an active fill can reach every edge of its own segment with zero gutter', () => {
  const trackRule = segmentedControlCss.match(/\.seg-control\s*\{([^}]*)\}/)[1];
  expect(trackRule).not.toMatch(/[^-]padding:/);
  expect(trackRule).not.toMatch(/gap:/);
  expect(trackRule).toMatch(/overflow:\s*hidden/);
  const itemRule = segmentedControlCss.match(/\.seg-control__item\s*\{([^}]*)\}/)[1];
  expect(itemRule).toMatch(/border-radius:\s*0/);
  expect(itemRule).toMatch(/margin:\s*0/);
  // Separation between segments comes only from a logical divider
  // border (RTL-safe), never a hardcoded left/right side.
  expect(itemRule).toMatch(/border-inline-start:/);
  expect(itemRule).not.toMatch(/border-(left|right):/);
});

test('the composer/drawer reclaim bare span/p/a/li color from the legacy App.css white-text reset', () => {
  expect(expensesCss).toMatch(/\.exp-composer-modal\s*:where\(span,\s*p,\s*a,\s*li\)/);
  expect(expensesCss).toMatch(/\.exp-drawer\s*:where\(span,\s*p,\s*a,\s*li\)/);
});
