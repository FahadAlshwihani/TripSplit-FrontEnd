import fs from 'fs';
import path from 'path';

test('Apache deployment preserves files and falls back BrowserRouter routes to index.html', () => {
  const rules = fs.readFileSync(path.join(process.cwd(), 'public', '.htaccess'), 'utf8');

  expect(rules).toContain('RewriteCond %{REQUEST_FILENAME} -f [OR]');
  expect(rules).toContain('RewriteCond %{REQUEST_FILENAME} -d');
  expect(rules).toContain('RewriteRule ^ index.html [L]');
  expect(rules).not.toMatch(/aarc|RewriteRule\s+\^api/i);
});
