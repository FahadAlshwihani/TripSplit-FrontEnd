const fs = require('fs');
const os = require('os');
const path = require('path');
const { generate, publicOrigin } = require('../../scripts/generate-seo-assets');

const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta name="description" content="base"/><meta name="robots" content="noindex,nofollow"/><meta property="og:title" content="base"/><meta property="og:description" content="base"/><meta property="og:site_name" content="TripSplit - قطتنا"/><meta name="twitter:title" content="base"/><meta name="twitter:description" content="base"/><title>base</title></head><body></body></html>';
let temp;
let oldSite;
let oldIndexing;
beforeEach(() => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tripsplit-seo-'));
  fs.writeFileSync(path.join(temp, 'index.html'), html);
  oldSite = process.env.REACT_APP_PUBLIC_SITE_URL;
  oldIndexing = process.env.REACT_APP_SEO_ALLOW_INDEXING;
  process.env.REACT_APP_PUBLIC_SITE_URL = 'https://tripsplit.example';
});
afterEach(() => {
  fs.rmSync(temp, { recursive: true, force: true });
  if (oldSite === undefined) delete process.env.REACT_APP_PUBLIC_SITE_URL; else process.env.REACT_APP_PUBLIC_SITE_URL = oldSite;
  if (oldIndexing === undefined) delete process.env.REACT_APP_SEO_ALLOW_INDEXING; else process.env.REACT_APP_SEO_ALLOW_INDEXING = oldIndexing;
});

test('temporary-domain mode blocks crawling while keeping a public-only sitemap', () => {
  process.env.REACT_APP_SEO_ALLOW_INDEXING = 'false';
  generate({ root: path.resolve(__dirname, '../..'), output: temp });
  expect(fs.readFileSync(path.join(temp, 'robots.txt'), 'utf8')).toBe('User-agent: *\nDisallow: /\n');
  const sitemap = fs.readFileSync(path.join(temp, 'sitemap.xml'), 'utf8');
  expect(sitemap).toContain('https://tripsplit.example/features');
  expect(sitemap).not.toMatch(/auth|invite|trips\//);
  expect(fs.readFileSync(path.join(temp, '__seo/features.html'), 'utf8')).toContain('noindex,nofollow');
});

test('indexable mode emits canonical public shells and sitemap discovery', () => {
  process.env.REACT_APP_SEO_ALLOW_INDEXING = 'true';
  generate({ root: path.resolve(__dirname, '../..'), output: temp });
  const robots = fs.readFileSync(path.join(temp, 'robots.txt'), 'utf8');
  expect(robots).toContain('Sitemap: https://tripsplit.example/sitemap.xml');
  const pricing = fs.readFileSync(path.join(temp, '__seo/pricing.html'), 'utf8');
  expect(pricing).toContain('index,follow');
  expect(pricing).toContain('<link rel="canonical" href="https://tripsplit.example/pricing"');
  expect(pricing).toContain('og:site_name');
  expect(pricing).toContain('<meta property="og:image" content="https://tripsplit.example/OG.png"');
  expect(pricing).toContain('<meta property="og:image:width" content="1200"');
  expect(pricing).toContain('<meta property="og:image:height" content="630"');
  expect(pricing).toContain('<meta name="twitter:image" content="https://tripsplit.example/OG.png"');
  const home = fs.readFileSync(path.join(temp, '__seo/home.html'), 'utf8');
  expect(home).toContain('WebSite');
  expect(home).toContain('WebApplication');
});

test('refuses loopback origins when indexing is enabled', () => {
  process.env.REACT_APP_SEO_ALLOW_INDEXING = 'true';
  expect(() => publicOrigin('http://localhost:3000')).toThrow(/loopback/);
});
