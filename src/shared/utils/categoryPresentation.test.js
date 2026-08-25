import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from './categoryPresentation';

const t = (key) => key;

test('a known system category resolves a real CSS var(), not an inline hex value', () => {
  expect(categoryColor('food')).toBe('var(--cat-orange)');
  expect(categoryTileColor('food')).toBe('var(--cat-orange-soft)');
});

test('every known system category has a distinct strong color from its neighbors', () => {
  const codes = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'flights', 'car_rental', 'fuel', 'groceries', 'tickets'];
  const colors = codes.map(categoryColor);
  // accommodation/groceries intentionally share green (matches the
  // approved direction), so dedupe before asserting distinctness.
  const unique = new Set(colors);
  expect(unique.size).toBeGreaterThanOrEqual(codes.length - 1);
});

test('an unrecognized or custom per-trip category falls back to the same neutral tile as Other, never a crash', () => {
  expect(categoryColor('some_custom_trip_category')).toBe(categoryColor('other'));
  expect(categoryTileColor('some_custom_trip_category')).toBe(categoryTileColor('other'));
});

test('categoryLabel resolves a real i18n key for every known system category', () => {
  expect(categoryLabel(t, 'food', 'Food')).toBe('categories.food');
  expect(categoryLabel(t, 'car_rental', 'Car Rental')).toBe('categories.carRental');
});

test('categoryLabel falls back to the server-provided name for an unrecognized category, never blank', () => {
  expect(categoryLabel(t, 'a_custom_trip_category', 'Custom Category')).toBe('Custom Category');
});

test('categoryIconClass maps the backend icon_key vocabulary to real Bootstrap Icons classes', () => {
  expect(categoryIconClass('utensils')).toBe('bi-cup-hot');
  expect(categoryIconClass('plane')).toBe('bi-airplane');
});

test('categoryIconClass falls back to a generic tag icon for an unrecognized icon_key', () => {
  expect(categoryIconClass('some_future_icon_key')).toBe('bi-tag');
});
