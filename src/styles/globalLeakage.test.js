import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.join(__dirname, 'App.css'), 'utf8');

test('legacy text and Bootstrap overrides stay scoped to MainLayout', () => {
  expect(css).not.toMatch(/(^|})\s*(h1|p|span|a|li|\.btn|\.alert)\s*[{,:]/m);
  expect(css).toMatch(/\.MainLayout h1/);
  expect(css).toMatch(/\.MainLayout p/);
  expect(css).toMatch(/\.MainLayout \.btn/);
});
