import fs from 'fs';
import path from 'path';

/*
  Repo-level guard against the legacy rocket loader (SVG rocket ship +
  smoke/meteor animation, formerly src/components/Loading.jsx) ever
  being reintroduced anywhere in the Dashboard. It was retired in favor
  of the one canonical NeoLoading component every route-level loading
  state (Suspense fallback, auth/onboarding bootstrap, TripLayout,
  every feature page) now uses -- see NeoLoading.jsx's own history.
  This walks the actual source tree rather than asserting against a
  fixed file list, so a future page that reintroduces the old import
  (or a copy-pasted rocket markup block) fails this test immediately
  instead of silently shipping a second loading system.
*/

const SRC_ROOT = path.join(__dirname, '..', '..');

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jsx?|css|scss)$/.test(entry.name) && entry.name !== 'legacyLoaderRemoval.test.js') files.push(full);
  }
  return files;
};

const sourceFiles = walk(SRC_ROOT);

test('the legacy rocket loader component and stylesheet no longer exist', () => {
  expect(fs.existsSync(path.join(SRC_ROOT, 'components', 'Loading.jsx'))).toBe(false);
  expect(fs.existsSync(path.join(SRC_ROOT, 'styles', 'Loading.scss'))).toBe(false);
});

test('no source file imports the retired components/Loading module', () => {
  const offenders = sourceFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return /from\s*['"][^'"]*components\/Loading['"]/.test(content);
  });
  expect(offenders).toEqual([]);
});

test('no source file contains the rocket loader\'s signature SVG markup', () => {
  // Markers unique to the retired loader's inline SVG -- NOT
  // "rocket-container"/"rocket-icon" alone, which Footer.jsx's
  // unrelated decorative brand icon also happens to use; these two
  // path ids only ever existed inside the deleted Loading.jsx.
  const offenders = sourceFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('rocket-svg') || content.includes('rocket-main-part') || content.includes('meteors-container');
  });
  expect(offenders).toEqual([]);
});

test('the root Suspense boundary (every React.lazy route) falls back to NeoLoading', () => {
  const content = fs.readFileSync(path.join(SRC_ROOT, 'app', 'routes', 'index.jsx'), 'utf8');
  expect(content).toMatch(/<Suspense fallback=\{<NeoLoading \/>\}>/);
});

test('the authenticated-route bootstrap guard (GatedRoute) shows NeoLoading while auth resolves', () => {
  const content = fs.readFileSync(path.join(SRC_ROOT, 'auth', 'GatedRoute.jsx'), 'utf8');
  expect(content).toMatch(/authLoading[\s\S]{0,40}<NeoLoading/);
});

test('the onboarding bootstrap guard (RequireOnboarding) shows NeoLoading while auth resolves', () => {
  const content = fs.readFileSync(path.join(SRC_ROOT, 'auth', 'RequireOnboarding.jsx'), 'utf8');
  expect(content).toMatch(/authLoading[\s\S]{0,40}<NeoLoading/);
});

test('every page-level ".loading" early return renders NeoLoading, never a bespoke/second loader', () => {
  const pageFiles = sourceFiles.filter((file) => /[\\/]pages[\\/].*\.jsx$/.test(file));
  const offenders = pageFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const hasLoadingReturn = /\.loading\s*\)\s*return\s*</.test(content) || /if\s*\(\s*\w+\.loading\s*\)\s*return\s*</.test(content);
    if (!hasLoadingReturn) return false;
    return !content.includes('NeoLoading');
  });
  expect(offenders).toEqual([]);
});
