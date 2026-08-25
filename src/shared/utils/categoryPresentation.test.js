import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from './categoryPresentation';

const t = (key) => key;

test('a known system category resolves a real CSS var(), not an inline hex value', () => {
  expect(categoryColor('food')).toBe('var(--cat-orange)');
  expect(categoryTileColor('food')).toBe('var(--cat-orange-soft)');
});

test('every known system category has a distinct strong color from its neighbors', () => {
  const codes = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'flights', 'car_rental', 'fuel', 'groceries', 'tickets'];
  // Not `codes.map(categoryColor)` -- Array.map passes (value, index,
  // array) to its callback, and categoryColor's 2nd param is now a real
  // explicit-color-key override, so the bare function reference would
  // silently receive each element's array index as that override.
  const colors = codes.map((code) => categoryColor(code));
  // accommodation/groceries intentionally share green (matches the
  // approved direction), so dedupe before asserting distinctness.
  const unique = new Set(colors);
  expect(unique.size).toBeGreaterThanOrEqual(codes.length - 1);
});

test('an explicit color key (a category\'s own chosen color) takes priority over the code-based default', () => {
  expect(categoryColor('food', 'purple')).toBe('var(--cat-purple)');
  expect(categoryTileColor('food', 'purple')).toBe('var(--cat-purple-soft)');
});

test('a blank explicit color (the 11 seeded defaults\' real value) falls back to the code-based default, not a crash', () => {
  expect(categoryColor('food', '')).toBe('var(--cat-orange)');
});

test('a custom category with an explicit color key never falls back to the neutral "Other" treatment', () => {
  expect(categoryColor('kayak_gear', 'teal')).toBe('var(--cat-teal)');
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
