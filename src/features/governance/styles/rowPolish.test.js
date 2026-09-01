const fs = require('fs');
const path = require('path');

/*
  Static CSS-source regression guard for two requested layout changes
  (jsdom has no layout engine, so computed styles can't be asserted --
  this checks the CSS source directly, same convention as settlements'
  own styles/containment.test.js):

  1. Join Requests and Restricted must read as one row-level pair on
     desktop (grid-row: 1), Invitations and Access Settings as another
     (grid-row: 2) -- a deliberate departure from the original literal
     Stitch main/side COLUMN composition (each column stacking two
     cards), replaced with row-level pairing per request. Each item
     keeps Stitch's own 8/12 (wide) or 4/12 (narrow) span -- only which
     row it's placed in changed.

  2. The join-request avatar must never be circular again -- it was a
     deliberate governance-specific override (border-radius: 999px,
     scoped to .gov-row__identity) making the shared, otherwise-square
     Avatar component circular just for this row. That override is
     gone; the avatar now renders inside its own rectangular end-cap
     block (.gov-row__avatar) that fills its slot and, at >=640px
     where .gov-row is a real horizontal row, stretches to match the
     row's own height.
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const governanceCss = read('features/governance/styles/governance.css');

const ruleFor = (css, selector) => {
  const escaped = selector.replace(/[.#]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\s|,)${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  if (!match) throw new Error(`No CSS rule found for ${selector}`);
  return match[1];
};

// --- Row-level pairing ---------------------------------------------------

test('the old main/side column wrapper classes are gone -- pairing now lives on the four named grid items', () => {
  expect(governanceCss).not.toMatch(/\.gov-grid__main\b/);
  expect(governanceCss).not.toMatch(/\.gov-grid__side\b/);
});

test('Join Requests (wide) and Restricted (narrow) share grid-row: 1 at the desktop breakpoint', () => {
  expect(governanceCss).toMatch(/\.gov-grid__requests\s*\{[^}]*grid-column:\s*span 8[^}]*grid-row:\s*1/);
  expect(governanceCss).toMatch(/\.gov-grid__restricted\s*\{[^}]*grid-column:\s*span 4[^}]*grid-row:\s*1/);
});

test('Invitations (wide) and Access Settings (narrow) share grid-row: 2 at the desktop breakpoint', () => {
  expect(governanceCss).toMatch(/\.gov-grid__invitations\s*\{[^}]*grid-column:\s*span 8[^}]*grid-row:\s*2/);
  expect(governanceCss).toMatch(/\.gov-grid__access\s*\{[^}]*grid-column:\s*span 4[^}]*grid-row:\s*2/);
});

test('below the desktop breakpoint, every grid item stacks full-width (no premature side-by-side on cramped tablet widths)', () => {
  const rule = ruleFor(governanceCss, '.gov-grid__requests,\n.gov-grid__restricted,\n.gov-grid__invitations,\n.gov-grid__access');
  expect(rule).toMatch(/grid-column:\s*1\s*\/\s*-1/);
});

// --- Rectangular avatar end-cap -------------------------------------------

test('the old circular override is gone -- no rule targeting the avatar (pf-avatar) sets a 999px/50% radius anywhere', () => {
  expect(governanceCss).not.toMatch(/pf-avatar[^{]*\{[^}]*border-radius:\s*(999px|50%)/);
  expect(governanceCss).not.toMatch(/\.gov-row__identity[^{]*pf-avatar/);
});

test('.gov-row__avatar exists as its own rectangular block, small-radius (never circular)', () => {
  const rule = ruleFor(governanceCss, '.gov-row__avatar');
  expect(rule).toMatch(/border-radius:\s*var\(--radius-sm\)/);
  expect(rule).not.toMatch(/border-radius:\s*(999px|50%)/);
});

test('the avatar fills its own slot completely (100% of the rectangular block), not the shared component\'s fixed 40x40 default', () => {
  const rule = ruleFor(governanceCss, '.gov-row__avatar .pf-avatar--md.pf-avatar--md');
  expect(rule).toMatch(/inline-size:\s*100%/);
  expect(rule).toMatch(/block-size:\s*100%/);
});

test('at >=640px (where .gov-row is a real horizontal row) the avatar block stretches to match the row\'s own height', () => {
  expect(governanceCss).toMatch(/@media \(min-width: 640px\) \{\s*\.gov-row \{[^}]*align-items:\s*stretch/);
  expect(governanceCss).toMatch(/@media \(min-width: 640px\) \{\s*\.gov-row__avatar \{[^}]*align-self:\s*stretch/);
});
