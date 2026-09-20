import { canonicalUrlFor, getPublicSiteUrl, resolveSeoState, SITE_NAME } from './metadata';

const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, REACT_APP_PUBLIC_SITE_URL: 'https://trip.fyaa.io', REACT_APP_SEO_ALLOW_INDEXING: 'true' };
});
afterAll(() => { process.env = originalEnv; });

test('defines the exact official bilingual site name', () => {
  expect(SITE_NAME).toBe('TripSplit - قطتنا');
});

test('resolves distinct Arabic and English public metadata', () => {
  const ar = resolveSeoState('/', 'ar');
  const en = resolveSeoState('/', 'en');
  expect(ar.title).toBe('TripSplit - قطتنا | قسم مصاريف السفر بسهولة مع قروبك');
  expect(ar.description).toContain('إدارة صندوق الرحلة وتسوية الحسابات');
  expect(en.title).toContain('Split group travel expenses');
  expect(ar.description).not.toBe(en.description);
  expect(ar.robots).toBe('index,follow');
  expect(ar.image).toBe('https://trip.fyaa.io/OG.png');
});

test('builds canonical URLs only for approved public routes', () => {
  expect(canonicalUrlFor('/features')).toBe('https://trip.fyaa.io/features');
  expect(canonicalUrlFor('/trips/private/expenses')).toBeNull();
  expect(resolveSeoState('/auth', 'ar').canonical).toBeNull();
});

test('private and unknown routes are noindex and unknown routes get 404 metadata', () => {
  expect(resolveSeoState('/trips/abc/overview', 'en').robots).toBe('noindex,nofollow');
  const unknown = resolveSeoState('/does-not-exist', 'en');
  expect(unknown.key).toBe('notFound');
  expect(unknown.title).toContain('Page not found');
  expect(unknown.structuredData).toBeNull();
});

test('homepage structured data describes only supported product capabilities', () => {
  const graph = resolveSeoState('/', 'ar').structuredData['@graph'];
  expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'WebApplication', 'WebPage']);
  expect(graph[0].alternateName).toEqual(['TripSplit', 'قطتنا']);
  expect(graph[1].applicationCategory).toBe('FinanceApplication');
  expect(graph[1]).not.toHaveProperty('aggregateRating');
  expect(graph[1]).not.toHaveProperty('review');
  expect(graph[1]).not.toHaveProperty('award');
});

test('indexing is disabled by default and public origins are validated', () => {
  delete process.env.REACT_APP_SEO_ALLOW_INDEXING;
  expect(resolveSeoState('/pricing', 'en').robots).toBe('noindex,nofollow');
  expect(getPublicSiteUrl('javascript:alert(1)')).toBeNull();
  expect(getPublicSiteUrl('https://trip.fyaa.io/?source=x')).toBeNull();
});
