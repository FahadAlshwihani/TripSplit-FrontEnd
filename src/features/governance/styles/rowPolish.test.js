const fs = require('fs');
const path = require('path');

/*
  Static CSS-source regression guard for two requested corrections
  (jsdom has no layout engine, so computed styles can't be asserted --
  this checks the CSS source directly, same convention as settlements'
  own styles/containment.test.js):

  1. CARD-to-CARD height alignment, not wrapper-to-wrapper. Join
     Requests/Invitations are [heading, then bordered card] while
     Restricted/Access Settings are ONE self-contained card with no
     heading above it. A plain grid-row stretch of the whole wide-side
     wrapper (heading+card together) against the narrow side's single
     card was tried first and was wrong: it bottom-aligns the two
     cards but not their TOP edges, since the wide side's card starts
     lower (below its own heading) while the stretched narrow-side card
     starts at the very top of the row. Fixed with CSS subgrid: each
     row-pair is split into a heading track (auto) and a card track
     (1fr) shared via subgrid across both items in the pair, so the
     narrow side's card is explicitly placed into the card track only,
     leaving the heading track above it empty (exactly as tall as the
     wide side's heading, nothing more) -- both cards now share the
     same top AND bottom edge.

  2. The join-request avatar's shape-only change (circle -> square) was
     previously over-implemented as a full structural move: pulled out
     of the identity block into its own dedicated full-row-height
     end-cap slot. That's reverted -- the avatar is back beside the
     identity text (Stitch's own layout), using the shared Avatar
     component's own default square/small-radius shape with no
     governance-specific sizing/position override at all.
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const governanceCss = read('features/governance/styles/governance.css');
const joinRequestsSource = read('features/governance/components/JoinRequestsSection.jsx');

const ruleFor = (css, selector) => {
  const escaped = selector.replace(/[.#]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\s|,)${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  if (!match) throw new Error(`No CSS rule found for ${selector}`);
  return match[1];
};

// --- Card-to-card height alignment (subgrid, not wrapper stretch) -------

test('the old main/side column wrapper classes are gone -- pairing lives on the four named grid items', () => {
  expect(governanceCss).not.toMatch(/\.gov-grid__main\b/);
  expect(governanceCss).not.toMatch(/\.gov-grid__side\b/);
});

test('each row-pair is split into a heading track (auto) and a shared card track (1fr) at the desktop breakpoint', () => {
  const rule = ruleFor(governanceCss, '.gov-grid');
  expect(rule).not.toMatch(/grid-template-rows/); // base rule has no row template (mobile stacks naturally)
  expect(governanceCss).toMatch(/@media \(min-width: 1024px\) \{\s*\.gov-grid \{ grid-template-rows: auto 1fr auto 1fr; \}/);
});

test('Join Requests (wide) and Restricted (narrow) both span the SAME two-track row-pair (rows 1/2) as a subgrid -- never a single flat grid-row', () => {
  expect(governanceCss).toMatch(/\.gov-grid__requests \{ grid-column: span 8 \/ span 8; grid-row: 1 \/ 3; \}/);
  expect(governanceCss).toMatch(/\.gov-grid__restricted \{ grid-column: span 4 \/ span 4; grid-row: 1 \/ 3; \}/);
  expect(governanceCss).toMatch(/\.gov-grid__requests,\s*\n\s*\.gov-grid__restricted,\s*\n\s*\.gov-grid__invitations,\s*\n\s*\.gov-grid__access \{\s*\n\s*display: grid;\s*\n\s*grid-template-rows: subgrid;/);
});

test('Invitations (wide) and Access Settings (narrow) both span the second row-pair (rows 3/4) as a subgrid', () => {
  expect(governanceCss).toMatch(/\.gov-grid__invitations \{ grid-column: span 8 \/ span 8; grid-row: 3 \/ 5; \}/);
  expect(governanceCss).toMatch(/\.gov-grid__access \{ grid-column: span 4 \/ span 4; grid-row: 3 \/ 5; \}/);
});

test('the narrow side\'s card is explicitly placed into the card track (local row 2), leaving the heading track empty above it', () => {
  const rule = ruleFor(governanceCss, '.gov-grid__restricted > .gov-restricted,\n  .gov-grid__access > .gov-settings');
  expect(rule).toMatch(/grid-row:\s*2/);
});

test('no rule stretches the whole wide-side WRAPPER (heading+card together) against the narrow side\'s single card -- the flex-fill mechanism from an earlier pass is gone', () => {
  expect(governanceCss).not.toMatch(/\.gov-grid\s*>\s*section\s*\{[^}]*align-self:\s*stretch/);
  // The old (wrong) approach put both requests/restricted at a single
  // shared "grid-row: 1" with no row-pair/subgrid split at all.
  expect(governanceCss).not.toMatch(/\.gov-grid__requests\s*\{\s*grid-column:\s*span 8\s*\/\s*span 8;\s*grid-row:\s*1;\s*\}/);
});

test('below the desktop breakpoint, every grid item stacks full-width (no premature side-by-side on cramped tablet widths)', () => {
  const rule = ruleFor(governanceCss, '.gov-grid__requests,\n.gov-grid__restricted,\n.gov-grid__invitations,\n.gov-grid__access');
  expect(rule).toMatch(/grid-column:\s*1\s*\/\s*-1/);
});

test('.gov-section (Requests/Invitations wrapper) overrides its own mobile-first flex with a higher-specificity double-class selector, so it reliably wins over source order at desktop', () => {
  expect(governanceCss).toMatch(/\.gov-grid__requests\.gov-section,\s*\n\s*\.gov-grid__invitations\.gov-section \{\s*\n\s*display: grid;\s*\n\s*grid-template-rows: subgrid;/);
});

// --- Avatar restored beside identity, square shape only -------------------

test('the end-cap avatar slot from the previous pass is completely gone -- no .gov-row__avatar class exists anywhere', () => {
  expect(governanceCss).not.toMatch(/\.gov-row__avatar\b/);
});

test('no rule anywhere makes the avatar (pf-avatar) circular (999px/50% radius) -- shape is square via the shared component\'s own default', () => {
  expect(governanceCss).not.toMatch(/pf-avatar[^{]*\{[^}]*border-radius:\s*(999px|50%)/);
});

test('no governance rule resizes the avatar away from the shared component\'s own 40x40 (size="md") default -- no 56px, no 100% fill', () => {
  expect(governanceCss).not.toMatch(/pf-avatar[^{]*\{[^}]*(inline-size|block-size|width|height):\s*(56px|100%)/);
});

test('.gov-row reverts to align-items: center at the desktop breakpoint -- no more stretch (that was only ever needed for the now-removed end-cap block)', () => {
  expect(governanceCss).toMatch(/@media \(min-width: 640px\) \{\s*\.gov-row \{ flex-direction: row; align-items: center;/);
});

test('JoinRequestsSection renders Avatar directly inside .gov-row__identity, before .gov-row__text -- Stitch\'s own [avatar][name] order, restored', () => {
  const identityBlock = joinRequestsSource.match(/<div className="gov-row__identity">([\s\S]*?)<\/div>\s*\n\s*{canReview/);
  expect(identityBlock).not.toBeNull();
  const avatarIndex = identityBlock[1].indexOf('<Avatar');
  const textIndex = identityBlock[1].indexOf('gov-row__text');
  expect(avatarIndex).toBeGreaterThan(-1);
  expect(textIndex).toBeGreaterThan(-1);
  expect(avatarIndex).toBeLessThan(textIndex);
});

test('JoinRequestsSection never renders a .gov-row__avatar wrapper', () => {
  expect(joinRequestsSource).not.toMatch(/gov-row__avatar/);
});
