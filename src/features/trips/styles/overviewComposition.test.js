import fs from 'fs';
import path from 'path';

// JSDOM does not lay out CSS; guard the intended breakpoints and shared strip
// styling here, with browser inspection covering actual geometry.
const overviewCss = fs.readFileSync(path.join(__dirname, 'overview.css'), 'utf8');
const intelligenceCss = fs.readFileSync(path.join(__dirname, '..', 'components', 'intelligence', 'intelligence.css'), 'utf8');
const intelligenceJsx = fs.readFileSync(path.join(__dirname, '..', 'components', 'intelligence', 'TripIntelligence.jsx'), 'utf8');

test('Overview metrics stack on mobile, form two columns at medium widths, and four equal columns on desktop', () => {
  expect(overviewCss).toMatch(/\.ov-cards\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/);
  expect(overviewCss).toMatch(/@media \(min-width:\s*640px\)[\s\S]*?\.ov-cards\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  expect(overviewCss).toMatch(/@media \(min-width:\s*1200px\)[\s\S]*?\.ov-cards\s*\{\s*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  expect(overviewCss).not.toMatch(/grid-row:\s*1\s*\/\s*span\s*2/);
});

test('Overview primary insight spans the metrics width with a compact RTL-aware horizontal composition', () => {
  expect(intelligenceCss).not.toMatch(/trip-intelligence--overview \.trip-intelligence__list\s*\{[^}]*max-width/);
  expect(intelligenceCss).toMatch(/trip-intelligence--overview \.trip-insight--primary\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;/);
  expect(intelligenceCss).toMatch(/trip-intelligence--overview \.trip-insight--primary\s*\{[^}]*border-inline-start:/);
  expect(intelligenceCss).toMatch(/trip-intelligence--overview \.trip-insight--primary \.trip-insight__dismiss\s*\{[^}]*width:\s*2\.125rem;/);
  expect(overviewCss).toMatch(/\.ov-page > \.trip-intelligence\s*\{[^}]*width:\s*100%/);
});

test('only the main insight action retains the raised press control; explanation stays a text disclosure', () => {
  expect(intelligenceJsx).toMatch(/trip-insight__control--primary pressable-sm/);
  expect(intelligenceJsx).toMatch(/trip-insight__control--secondary" type="button" aria-expanded=\{explained\}/);
  expect(intelligenceCss).toMatch(/trip-insight__actions \.trip-insight__control--secondary\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent/);
});
