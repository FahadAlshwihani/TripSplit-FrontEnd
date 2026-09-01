import { formatDateTime, formatRelativeTime } from './format';

test('date-time formatting follows the active app language', () => {
  const value = '2026-08-20T12:30:00Z';

  expect(formatDateTime(value, 'en')).toEqual(new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)));
  expect(formatDateTime(value, 'ar')).toEqual(new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)));
});

test('missing date-time values stay absent', () => {
  expect(formatDateTime(null, 'ar')).toBeNull();
});

test('relative time reads "N minutes ago" style, locale-aware, never a raw timestamp', () => {
  const eightMinutesAgo = new Date(Date.now() - 8 * 60 * 1000).toISOString();
  expect(formatRelativeTime(eightMinutesAgo, 'en')).toMatch(/8 minutes ago/);
  expect(formatRelativeTime(eightMinutesAgo, 'ar')).toEqual(new Intl.RelativeTimeFormat('ar-SA', { numeric: 'auto' }).format(-8, 'minute'));
});

test('relative time falls back to the coarsest matching unit for older values', () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  expect(formatRelativeTime(threeDaysAgo, 'en')).toMatch(/3 days ago/);
});

test('missing relative-time values stay absent', () => {
  expect(formatRelativeTime(null, 'en')).toBeNull();
});
