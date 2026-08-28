import { formatDateTime } from './format';

test('date-time formatting follows the active app language', () => {
  const value = '2026-08-20T12:30:00Z';

  expect(formatDateTime(value, 'en')).toEqual(new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)));
  expect(formatDateTime(value, 'ar')).toEqual(new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)));
});

test('missing date-time values stay absent', () => {
  expect(formatDateTime(null, 'ar')).toBeNull();
});
