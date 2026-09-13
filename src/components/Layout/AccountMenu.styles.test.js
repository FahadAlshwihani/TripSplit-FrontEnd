import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.resolve(__dirname, '../../styles/PublicLayout.css'), 'utf8');

test('landing account name remains visible at mobile widths and truncates on one line', () => {
  expect(css).toMatch(/\.public-nav \.account-menu__name\s*\{[\s\S]*?display:\s*block;/);
  expect(css).toMatch(/\.account-menu__name\s*\{[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/);
  expect(css).not.toMatch(/@media\s*\(max-width:\s*430px\)[\s\S]*?\.public-nav \.account-menu__name\s*\{\s*display:\s*none;/);
});

test('avatar fills the trigger edge slot without an inner border or circular override', () => {
  expect(css).toMatch(/\.account-menu__avatar-slot\s*\{[\s\S]*?inline-size:\s*40px;[\s\S]*?overflow:\s*hidden;/);
  expect(css).toMatch(/\.account-menu__avatar-slot\s*\{[\s\S]*?border-inline-end:\s*var\(--border-width\) solid var\(--color-border\);/);
  expect(css).toMatch(/\.account-menu__avatar-slot\s*>\s*\.pf-avatar\s*\{[\s\S]*?inline-size:\s*100%;[\s\S]*?block-size:\s*100%;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;/);
  expect(css).not.toMatch(/account-menu__avatar[^\{]*\{[^}]*border-radius:\s*(?:50%|var\(--radius-pill\))/);
});

test('account trigger retains the established inward press interaction contract', () => {
  expect(css).toMatch(/\.account-menu__trigger\s*\{[\s\S]*?box-shadow:\s*var\(--shadow-hard-sm\);/);
  expect(css).toMatch(/\.account-menu__trigger:hover[^\{]*\{[^}]*box-shadow:\s*var\(--shadow-hard-sm-hover\);[^}]*transform:\s*var\(--press-sm-hover\)/);
  expect(css).toMatch(/\.account-menu__trigger:active[^\{]*\{[^}]*box-shadow:\s*var\(--shadow-hard-sm-active\);[^}]*transform:\s*var\(--press-sm-active\)/);
  expect(css).not.toMatch(/\.account-menu__trigger:hover[^\{]*\{[^}]*translate(?:Y)?\s*\(\s*-/);
});

test('directional layout uses logical properties without visual order hacks', () => {
  const accountRules = css.match(/\.account-menu__(?:trigger|name|chevron|avatar-slot)[^\{]*\{[^}]*\}/g).join('\n');
  expect(accountRules).toMatch(/margin-inline:/);
  expect(accountRules).toMatch(/margin-inline-end:/);
  expect(accountRules).toMatch(/border-inline-end:/);
  expect(accountRules).not.toMatch(/(?:margin|padding|border)-(?:left|right):/);
  expect(accountRules).not.toMatch(/(?:^|[;{]\s*)(?:flex-direction|order)\s*:/m);
});
