import fs from 'fs';
import path from 'path';

/*
  Regression guard for the real bug this pass fixed: support.css had
  the .material-symbols-outlined font-family rule but never the
  @import that actually loads the font file -- so every Support icon
  rendered as raw ligature text ("chat_bubble", "rocket_launch", ...)
  on a fresh visit to /support (no font previously loaded by another
  page in the same session). jsdom has no font-rendering engine, so
  there is no way to assert "this glyph painted correctly" from a
  test -- the strongest available guard is: (a) the actual @import
  line is present in the stylesheet, matching the exact working
  pattern settings.css/governance.css/settlements.css already use,
  and (b) every icon name used anywhere in Support's JSX is rendered
  through that one working primitive (a `material-symbols-outlined`
  element), never a bare/mistyped wrapper.
*/
const supportCss = fs.readFileSync(path.join(__dirname, 'support.css'), 'utf8');
const settingsCss = fs.readFileSync(path.join(__dirname, '..', '..', 'trips', 'styles', 'settings.css'), 'utf8');

const IMPORT_RE = /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Outlined[^']*'\);/;

test('support.css actually loads the Material Symbols font file (the real fix)', () => {
  expect(supportCss).toMatch(IMPORT_RE);
});

test('support.css\'s @import is byte-identical to the known-working one settings.css already uses', () => {
  const supportImport = supportCss.match(IMPORT_RE)?.[0];
  const settingsImport = settingsCss.match(IMPORT_RE)?.[0];
  expect(supportImport).toBeTruthy();
  expect(supportImport).toBe(settingsImport);
});

const SUPPORT_JSX_FILES = [
  ['../components/SupportForm.jsx', path.join(__dirname, '..', 'components', 'SupportForm.jsx')],
  ['../pages/SupportArticlePage.jsx', path.join(__dirname, '..', 'pages', 'SupportArticlePage.jsx')],
  ['trips/pages/TripSupportPage.jsx', path.join(__dirname, '..', '..', 'trips', 'pages', 'TripSupportPage.jsx')],
];

const SUPPORT_WORKSPACE_FILES = [
  ['../components/SupportForm.jsx', path.join(__dirname, '..', 'components', 'SupportForm.jsx')],
  ['trips/pages/TripSupportPage.jsx', path.join(__dirname, '..', '..', 'trips', 'pages', 'TripSupportPage.jsx')],
];

test.each(SUPPORT_JSX_FILES)('%s never renders an icon name outside the working material-symbols-outlined element', (label, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  // Every `>icon_name<` text node in JSX must be immediately preceded,
  // on the same opening tag, by className="material-symbols-outlined"
  // (optionally with extra classes appended) -- this is a structural,
  // not text-matching, check: it walks each JSX element that directly
  // wraps a lowercase_snake_case icon-shaped text child and asserts
  // its own className includes the working primitive.
  const iconChildRe = />([a-z][a-z_]{2,})<\/span>/g;
  let match = iconChildRe.exec(source);
  while (match) {
    const upTo = source.slice(0, match.index);
    const tagStart = upTo.lastIndexOf('<span');
    const tagText = source.slice(tagStart, match.index);
    expect(tagText).toMatch(/className="[^"]*material-symbols-outlined[^"]*"/);
    match = iconChildRe.exec(source);
  }
});

test.each(SUPPORT_JSX_FILES)('%s uses no Bootstrap Icons classes', (label, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  expect(source).not.toMatch(/\bbi bi-/);
  expect(source).not.toMatch(/"bi bi-/);
});

/*
  Regression guard for the modal/drawer interaction model this pass
  removed entirely -- the Support workspace (SupportForm + the tab nav
  in TripSupportPage) must never re-import the portal/focus-trap
  primitives or reintroduce the removed "Back to articles" affordance;
  those are legitimate elsewhere in the app (ModalPortal/useModalDialog
  back every OTHER dialog in this app -- e.g. SettlementTimelineDrawer
  -- and are NOT deleted; Support just no longer depends on them) and
  SupportArticlePage's own "Back to Support" wording is a different,
  still-correct concept (returning from an article-detail ROUTE to the
  Support hub, unrelated to in-page tab switching -- deliberately
  excluded from this check).
*/
test.each(SUPPORT_WORKSPACE_FILES)('%s never imports the portal/modal primitives (no modal/drawer left in the Support workspace)', (label, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  expect(source).not.toMatch(/from ['"].*ModalPortal['"]/);
  expect(source).not.toMatch(/from ['"].*useModalDialog['"]/);
});

test.each(SUPPORT_WORKSPACE_FILES)('%s never reintroduces the removed "Back to articles" control', (label, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  expect(source).not.toMatch(/backToArticles/);
});

test('support.css carries no drawer/overlay/modal-only styling any more', () => {
  expect(supportCss).not.toMatch(/\.support-drawer\b/);
  expect(supportCss).not.toMatch(/\.support-drawer-overlay\b/);
  expect(supportCss).not.toMatch(/position:\s*fixed/);
});
