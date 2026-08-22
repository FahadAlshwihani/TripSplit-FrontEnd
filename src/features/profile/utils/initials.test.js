import { getInitials } from './initials';

test('two-word names take the first letter of the first and last word', () => {
  expect(getInitials('Alex Smith')).toBe('AS');
});

test('single-word names take the first two graphemes, uppercased', () => {
  expect(getInitials('Fahad')).toBe('FA');
});

test('single-word Arabic names take the first two graphemes unchanged (no Latin case rules apply)', () => {
  expect(getInitials('فهد')).toBe('فه');
});

test('multi-word Arabic names take the first letter of the first and last word', () => {
  expect(getInitials('فهد الشمري')).toBe('فش');
});

test('three or more words still use only the first and last word', () => {
  expect(getInitials('Mary Jane Watson')).toBe('MW');
});

test('surrounding whitespace and repeated internal spaces are trimmed/collapsed', () => {
  expect(getInitials('  Alex   Smith  ')).toBe('AS');
});

test('empty or whitespace-only input returns an empty string', () => {
  expect(getInitials('')).toBe('');
  expect(getInitials('   ')).toBe('');
  expect(getInitials(undefined)).toBe('');
});
