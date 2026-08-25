const fs = require('fs');
const path = require('path');

/*
  jsdom doesn't apply real stylesheet cascade/specificity resolution, so
  the actual bug this guards against can't be reproduced by rendering +
  computed-style assertions: a broad `.public-layout a { color: inherit }`
  reset (specificity 0,1,1) outranked single-class primary-button color
  rules like .btn--primary/.acc-btn--primary/.pricing-receipt__cta
  (specificity 0,1,0) for any primary CTA rendered as <Link>/<a> --
  turning "Create Trip" (Home hero, Account quick action) and the
  Pricing CTA's label dark-on-indigo instead of white-on-indigo.

  This reads the source CSS directly and asserts each page's bare-element
  text-color reset lists exactly p/span/li -- never `a` -- so that fix
  can't silently regress. See PublicLayout.css's own comment for the
  full specificity explanation.
*/
const readCss = (relativePath) => fs.readFileSync(path.join(__dirname, relativePath), 'utf8');

test('PublicLayout.css resets bare <p>/<span>/<li> color, but never <a> (would outrank single-class primary-button colors)', () => {
  const css = readCss('PublicLayout.css');
  expect(css).toMatch(/\.public-layout p,\s*\n\s*\.public-layout span,\s*\n\s*\.public-layout li \{\s*\n\s*color: inherit;/);
  expect(css).not.toMatch(/\.public-layout a \{\s*\n?\s*color: inherit;/);
  expect(css).not.toMatch(/\.public-layout a,\s*\n\s*\.public-layout (p|span|li)/);
});

test("auth.css's standalone OTP-page guard resets p/span/li, but never <a>", () => {
  const css = readCss('../features/auth/styles/auth.css');
  expect(css).toMatch(/\.otp-page p,\s*\n\s*\.otp-page span,\s*\n\s*\.otp-page li \{ color: inherit; \}/);
  expect(css).not.toMatch(/\.otp-page a,\s*\n\s*\.otp-page (p|span|li)/);
});

test("profileSetup.css's standalone guard resets p/span/li, but never <a>", () => {
  const css = readCss('../features/profile/styles/profileSetup.css');
  expect(css).toMatch(/\.profile-setup-page p,\s*\n\s*\.profile-setup-page span,\s*\n\s*\.profile-setup-page li \{ color: inherit; \}/);
  expect(css).not.toMatch(/\.profile-setup-page a,\s*\n\s*\.profile-setup-page (p|span|li)/);
});
