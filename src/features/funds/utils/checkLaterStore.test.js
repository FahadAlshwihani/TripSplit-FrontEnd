import { loadCheckedLater, markCheckedLater } from './checkLaterStore';

beforeEach(() => localStorage.clear());

test('starts empty when nothing has been dismissed', () => {
  expect(loadCheckedLater()).toEqual(new Set());
});

test('marking a contribution checked-later persists it for the next load', () => {
  markCheckedLater('c1');
  expect(loadCheckedLater()).toEqual(new Set(['c1']));
});

test('marking the same id twice never duplicates it', () => {
  markCheckedLater('c1');
  markCheckedLater('c1');
  expect([...loadCheckedLater()]).toEqual(['c1']);
});

test('tolerates corrupted storage instead of throwing', () => {
  localStorage.setItem('tripsplit:fund-checked-later', '{not valid json');
  expect(loadCheckedLater()).toEqual(new Set());
});
