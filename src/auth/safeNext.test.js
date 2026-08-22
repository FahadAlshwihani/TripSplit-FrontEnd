import { getSafeNext, buildAuthUrl } from './safeNext';

describe('getSafeNext', () => {
  test('accepts a plain internal path', () => {
    expect(getSafeNext('?next=%2Fcreate-trip')).toBe('/create-trip');
  });

  test('accepts a nested internal path with query segments encoded', () => {
    expect(getSafeNext('?next=%2Finvite%2Fabc123')).toBe('/invite/abc123');
  });

  test('falls back to "/" when next is missing', () => {
    expect(getSafeNext('')).toBe('/');
  });

  test('rejects a protocol-relative URL (//host/path)', () => {
    expect(getSafeNext('?next=%2F%2Fevil.example.com')).toBe('/');
  });

  test('rejects an absolute external URL', () => {
    expect(getSafeNext('?next=https%3A%2F%2Fevil.example.com')).toBe('/');
  });

  test('rejects a javascript: URL', () => {
    expect(getSafeNext('?next=javascript%3Aalert(1)')).toBe('/');
  });

  test('rejects a backslash-prefixed path some browsers treat like //', () => {
    expect(getSafeNext('?next=%2F%5Cevil.example.com')).toBe('/');
  });

  test('honors a custom fallback', () => {
    expect(getSafeNext('?next=notapath', '/home')).toBe('/home');
  });
});

describe('buildAuthUrl', () => {
  test('appends an encoded next param for a non-root destination', () => {
    expect(buildAuthUrl('/create-trip')).toBe('/auth?next=%2Fcreate-trip');
  });

  test('omits the next param for the root destination', () => {
    expect(buildAuthUrl('/')).toBe('/auth');
  });

  test('omits the next param when no destination is given', () => {
    expect(buildAuthUrl()).toBe('/auth');
  });
});
