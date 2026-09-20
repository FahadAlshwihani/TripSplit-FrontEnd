const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');

function readPublic(name) {
  return fs.readFileSync(path.join(publicDir, name));
}

function pngDimensions(name) {
  const image = readPublic(name);
  expect(image.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

test('fallback document wires the complete TripSplit browser identity', () => {
  const html = readPublic('index.html').toString('utf8');

  expect(html).toContain('<title>TripSplit - قطتنا | قسم مصاريف السفر بسهولة مع قروبك</title>');
  expect(html).toContain('name="description" content="TripSplit - قطتنا يساعدك');
  expect(html).toContain('rel="icon" href="%PUBLIC_URL%/favicon.ico" sizes="any"');
  expect(html).toContain('sizes="32x32" href="%PUBLIC_URL%/favicon-32x32.png"');
  expect(html).toContain('sizes="16x16" href="%PUBLIC_URL%/favicon-16x16.png"');
  expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="%PUBLIC_URL%/apple-touch-icon.png"');
  expect(html).toContain('rel="manifest" href="%PUBLIC_URL%/site.webmanifest"');
  expect(html).toContain('property="og:site_name" content="TripSplit - قطتنا"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain('name="robots" content="noindex,nofollow"');
  expect(html).not.toMatch(/React App|Travel Budget Tracker|Travel Budget/);
});

test('manifest names the real product and advertises the verified install icons', () => {
  const manifest = JSON.parse(readPublic('site.webmanifest').toString('utf8'));

  expect(manifest).toMatchObject({
    name: 'TripSplit - قطتنا',
    short_name: 'TripSplit',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1e30b2',
    background_color: '#fbf9f4',
  });
  expect(manifest.description).toContain('مصاريف السفر');
  expect(manifest.icons).toEqual([
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ]);
});

test.each([
  ['favicon-16x16.png', 16, 16],
  ['favicon-32x32.png', 32, 32],
  ['apple-touch-icon.png', 180, 180],
  ['android-chrome-192x192.png', 192, 192],
  ['android-chrome-512x512.png', 512, 512],
  ['OG.png', 1200, 630],
])('%s exists with its advertised dimensions', (name, width, height) => {
  expect(pngDimensions(name)).toEqual({ width, height });
});

test('favicon container exists and robots keeps the source fallback restrictive', () => {
  expect(readPublic('favicon.ico').length).toBeGreaterThan(0);
  expect(readPublic('robots.txt').toString('utf8')).toContain('Disallow: /');
});

test('public-facing English copy does not retain the spaced legacy brand name', () => {
  const english = fs.readFileSync(path.join(process.cwd(), 'src', 'i18n', 'locales', 'en.json'), 'utf8');
  expect(english).not.toContain('"Trip Split"');
});
