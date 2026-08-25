// Maps the backend's category icon_key (a small fixed vocabulary seeded
// once in apps/expenses/migrations/0005_seed_default_categories.py) to a
// Bootstrap Icons class -- the icon set already used everywhere else in
// this app. Falls back to a generic tag icon for any custom per-trip
// category or an unrecognized key, so a new/renamed backend icon_key can
// never render nothing.
const ICON_MAP = {
  bed: 'bi-house-door',
  utensils: 'bi-cup-hot',
  car: 'bi-car-front',
  ticket: 'bi-ticket-perforated',
  bag: 'bi-bag',
  plane: 'bi-airplane',
  'car-key': 'bi-key',
  fuel: 'bi-fuel-pump',
  basket: 'bi-basket',
  tag: 'bi-tag',
};

export const categoryIconClass = (iconKey) => ICON_MAP[iconKey] || 'bi-tag';
