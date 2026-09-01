import { tripUrl } from './shareLinks';

test('builds a canonical short_code URL from the current origin, no path', () => {
  expect(tripUrl('abc123')).toBe(`${window.location.origin}/trips/abc123`);
});

test('appends the given path', () => {
  expect(tripUrl('abc123', '/fund')).toBe(`${window.location.origin}/trips/abc123/fund`);
});

test('appends non-empty query params', () => {
  expect(tripUrl('abc123', '/fund', { round: 'round-1' })).toBe(`${window.location.origin}/trips/abc123/fund?round=round-1`);
});

test('omits falsy/empty query param values instead of writing them as literal "undefined"/""', () => {
  expect(tripUrl('abc123', '/settlements', { settlement: undefined })).toBe(`${window.location.origin}/trips/abc123/settlements`);
  expect(tripUrl('abc123', '/settlements', { settlement: '' })).toBe(`${window.location.origin}/trips/abc123/settlements`);
});

test('never accepts or embeds a raw UUID identifier by construction -- callers only ever pass short_code', () => {
  const url = tripUrl('short-code-only');
  expect(url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
});
