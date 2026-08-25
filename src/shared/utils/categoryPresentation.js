/*
  Canonical presentation metadata for TripSplit's trip category catalog.
  The backend (apps.expenses.models.TripCategory) owns the stable
  financial classification -- a category's `code` (e.g. "food"), which
  the overview/expenses APIs group spending by -- and never stores a
  translated display string as part of the API contract. This module is
  the ONE place that maps that stable code to UI-only concerns (icon,
  color, i18n label), so every surface that renders a category
  (Overview today; Expenses/Fund/category budgets/charts/filters later)
  shares one identity instead of re-deriving its own per feature.

  Deliberately split in two, keyed by two different authoritative
  fields:
  - ICON_MAP is keyed by `icon_key`, the backend's own small fixed icon
    vocabulary (seeded in apps/expenses/migrations/0005_seed_default_
    categories.py) -- the backend already returns this per row, so the
    icon glyph itself stays backend-driven and this only translates it
    to the Bootstrap Icons class already used everywhere else in the app.
  - COLOR_MAP/LABEL_KEY_MAP are keyed by `code`, and are 100% frontend-
    owned presentation: the backend has no reason to know a category's
    color or how to say its name in Arabic.

  A custom per-trip category (or a legacy/unrecognized code) has no
  entry in COLOR_MAP/LABEL_KEY_MAP by design -- nobody can pre-translate
  a member's own free-text category name. Callers fall back to a
  neutral tile and the server's own display name, never a blank or a
  crash (see categoryColor/categoryLabel below).
*/

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

// code -> [strong color, soft/tile tint, i18n label key]. Covers every
// system category currently seeded (apps/expenses/migrations/0005_seed_
// default_categories.py): accommodation, food, transport, activities,
// shopping, flights, car_rental, fuel, groceries, tickets, other.
// `strong` is the category's stable identity color (progress bar fill --
// needs to read clearly against the neutral track); `soft` is its pastel
// tile tint (icon tile background -- needs to stay light enough for a
// dark icon drawn on top to stay legible, the same soft-background/dark-
// foreground pattern the Total Spent/My Balance cards already use).
const CATEGORY_PRESENTATION = {
  accommodation: { strongVar: '--color-success', softVar: '--color-success-soft', labelKey: 'categories.accommodation' },
  food: { strongVar: '--cat-orange', softVar: '--cat-orange-soft', labelKey: 'categories.food' },
  transport: { strongVar: '--color-primary', softVar: '--color-primary-soft', labelKey: 'categories.transport' },
  activities: { strongVar: '--cat-teal', softVar: '--cat-teal-soft', labelKey: 'categories.activities' },
  shopping: { strongVar: '--cat-pink', softVar: '--cat-pink-soft', labelKey: 'categories.shopping' },
  flights: { strongVar: '--cat-sky', softVar: '--cat-sky-soft', labelKey: 'categories.flights' },
  car_rental: { strongVar: '--cat-slate', softVar: '--cat-slate-soft', labelKey: 'categories.carRental' },
  fuel: { strongVar: '--color-warning', softVar: '--color-warning-soft', labelKey: 'categories.fuel' },
  groceries: { strongVar: '--color-success', softVar: '--color-success-soft', labelKey: 'categories.groceries' },
  tickets: { strongVar: '--cat-purple', softVar: '--cat-purple-soft', labelKey: 'categories.tickets' },
  other: { strongVar: '--color-text-muted', softVar: '--color-surface-container', labelKey: 'categories.other' },
};

const FALLBACK = { strongVar: '--color-text-muted', softVar: '--color-surface-container' };

// A custom per-trip category or unrecognized/legacy code gets the same
// neutral treatment as "Other" -- deliberately not a bright/attention-
// grabbing color, since nothing was actually designed for it.
export const categoryColor = (code) => `var(${CATEGORY_PRESENTATION[code]?.strongVar || FALLBACK.strongVar})`;
export const categoryTileColor = (code) => `var(${CATEGORY_PRESENTATION[code]?.softVar || FALLBACK.softVar})`;

// Localized display label for a canonical system category. Falls back
// to the server's own `name` for anything not in the catalog above --
// never blank, never a guessed translation for text nobody wrote.
export const categoryLabel = (t, code, fallbackName) => {
  const meta = CATEGORY_PRESENTATION[code];
  return meta ? t(meta.labelKey) : fallbackName;
};
