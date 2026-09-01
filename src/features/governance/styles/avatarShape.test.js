const fs = require('fs');
const path = require('path');

/*
  Static CSS-source regression guard for the join-request avatar's
  shape-only change (jsdom has no layout engine, so computed styles
  can't be asserted -- this checks the CSS source directly, same
  convention as settlements' own styles/containment.test.js):

  Stitch's own mock shows a circular 40x40 avatar; this app's brand
  identity everywhere else (Members, etc.) is a small-radius square, so
  only the SHAPE was changed here -- the shared Avatar component's own
  default (border-radius: var(--radius-sm), size="md" = 40x40) is used
  as-is, with no governance-specific override at all.

  An earlier pass over-implemented this as a full structural move: the
  avatar was pulled out of the identity block into its own dedicated,
  full-row-height end-cap slot (.gov-row__avatar). That was reverted --
  the avatar renders directly inside .gov-row__identity again, beside
  the name/text, exactly where it was before any of this work started.
*/

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', '..', relativePath), 'utf8');

const governanceCss = read('features/governance/styles/governance.css');
const joinRequestsSource = read('features/governance/components/JoinRequestsSection.jsx');

test('the end-cap avatar slot from the reverted pass is completely gone -- no .gov-row__avatar class exists anywhere', () => {
  expect(governanceCss).not.toMatch(/\.gov-row__avatar\b/);
});

test('no rule anywhere makes the avatar (pf-avatar) circular (999px/50% radius) -- shape is square via the shared component\'s own default', () => {
  expect(governanceCss).not.toMatch(/pf-avatar[^{]*\{[^}]*border-radius:\s*(999px|50%)/);
});

test('no governance rule resizes the avatar away from the shared component\'s own 40x40 (size="md") default -- no 56px, no 100% fill', () => {
  expect(governanceCss).not.toMatch(/pf-avatar[^{]*\{[^}]*(inline-size|block-size|width|height):\s*(56px|100%)/);
});

test('.gov-row uses align-items: center at the desktop breakpoint -- no leftover stretch from the removed end-cap block', () => {
  expect(governanceCss).toMatch(/@media \(min-width: 640px\) \{\s*\.gov-row \{ flex-direction: row; align-items: center;/);
});

test('JoinRequestsSection renders Avatar directly inside .gov-row__identity, before .gov-row__text -- Stitch\'s own [avatar][name] order', () => {
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
