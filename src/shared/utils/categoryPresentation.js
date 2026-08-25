/*
  Canonical presentation metadata for TripSplit's trip category catalog.
  The backend (apps.expenses.models.TripCategory) owns the stable
  financial classification -- a category's `code` (e.g. "food"), which
  the overview/expenses APIs group spending by -- and never stores a
  translated display string as part of the API contract. This module is
  the ONE place that maps that stable code to UI-only concerns (icon,
  color, i18n label), so every surface that renders a category
  (Overview, Expenses Ledger, category management) shares one identity
  instead of re-deriving its own per feature.

  Split across three keys, matching three different authoritative fields:
  - ICON_MAP is keyed by `icon_key`, the backend's own small fixed icon
    vocabulary (apps/expenses/serializers.py::ICON_KEY_CHOICES) -- the
    backend already returns this per row, so the icon glyph itself stays
    backend-driven and this only translates it to the Bootstrap Icons
    class already used everywhere else in the app.
  - COLOR_TOKENS is keyed by `color`, the backend's own fixed color
    palette (apps.expenses.models.TripCategory.Color) -- a category that
    explicitly chose one (only possible for a custom category; the 11
    seeded defaults are intentionally left blank) uses it directly.
  - CATEGORY_PRESENTATION is keyed by `code`, and is the fallback used
    when a category has no explicit `color` of its own: the 11 seeded
    defaults' historical code->color mapping, kept exactly as before so
    nothing visually shifts for them. Also carries the i18n label key,
    which is 100% frontend-owned (the backend has no reason to know how
    to say a category's name in Arabic).

  A custom per-trip category with no explicit color, or a legacy/
  unrecognized code, gets the same neutral "Other" treatment -- never a
  blank or a crash (see categoryColor/categoryLabel below).
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

// Exposed so an icon picker UI can render every real, safe option
// (matching apps/expenses/serializers.py::ICON_KEY_CHOICES exactly)
// without hardcoding a second copy of this list.
export const CATEGORY_ICON_KEYS = Object.keys(ICON_MAP);

// A category creator can pick any of these (apps.expenses.models.
// TripCategory.Color -- kept in sync manually since color is 100%
// frontend-rendered presentation, the same reasoning icon/label already
// use). `strong` is the identity color (progress bar fill -- needs to
// read clearly against the neutral track); `soft` is the pastel tile
// tint (icon tile background -- needs to stay light enough for a dark
// icon drawn on top to stay legible, the same soft-background/dark-
// foreground pattern the Total Spent/My Balance cards already use).
const COLOR_TOKENS = {
  green: { strongVar: '--color-success', softVar: '--color-success-soft' },
  orange: { strongVar: '--cat-orange', softVar: '--cat-orange-soft' },
  indigo: { strongVar: '--color-primary', softVar: '--color-primary-soft' },
  teal: { strongVar: '--cat-teal', softVar: '--cat-teal-soft' },
  pink: { strongVar: '--cat-pink', softVar: '--cat-pink-soft' },
  sky: { strongVar: '--cat-sky', softVar: '--cat-sky-soft' },
  slate: { strongVar: '--cat-slate', softVar: '--cat-slate-soft' },
  amber: { strongVar: '--color-warning', softVar: '--color-warning-soft' },
  purple: { strongVar: '--cat-purple', softVar: '--cat-purple-soft' },
  gray: { strongVar: '--color-text-muted', softVar: '--color-surface-container' },
};

// Exposed so a color picker UI can render every real, safe option
// without hardcoding a second copy of this list.
export const CATEGORY_COLOR_KEYS = Object.keys(COLOR_TOKENS);

// code -> [color key, i18n label key]. Covers every system category
// currently seeded (apps/expenses/migrations/0005_seed_default_
// categories.py): accommodation, food, transport, activities, shopping,
// flights, car_rental, fuel, groceries, tickets, other. Used only as a
// fallback when the category itself has no explicit `color` -- true for
// all 11 of these today (blank by design, see the module docstring).
const CATEGORY_PRESENTATION = {
  accommodation: { colorKey: 'green', labelKey: 'categories.accommodation' },
  food: { colorKey: 'orange', labelKey: 'categories.food' },
  transport: { colorKey: 'indigo', labelKey: 'categories.transport' },
  activities: { colorKey: 'teal', labelKey: 'categories.activities' },
  shopping: { colorKey: 'pink', labelKey: 'categories.shopping' },
  flights: { colorKey: 'sky', labelKey: 'categories.flights' },
  car_rental: { colorKey: 'slate', labelKey: 'categories.carRental' },
  fuel: { colorKey: 'amber', labelKey: 'categories.fuel' },
  groceries: { colorKey: 'green', labelKey: 'categories.groceries' },
  tickets: { colorKey: 'purple', labelKey: 'categories.tickets' },
  other: { colorKey: 'gray', labelKey: 'categories.other' },
};

const FALLBACK_COLOR_KEY = 'gray';

const resolveColorKey = (code, explicitColorKey) => explicitColorKey || CATEGORY_PRESENTATION[code]?.colorKey || FALLBACK_COLOR_KEY;

// A custom per-trip category with no explicit color, or an unrecognized/
// legacy code, gets the same neutral "Other" treatment -- deliberately
// not a bright/attention-grabbing color, since nothing was actually
// designed for it. Pass the category's own `color` field (from the
// TripCategory catalog, e.g. an Overview category_ledger row or an
// Expenses Ledger row's resolved category object) as the second
// argument wherever it's available; omit it to fall back to the
// code-keyed default.
export const categoryColor = (code, explicitColorKey) => `var(${COLOR_TOKENS[resolveColorKey(code, explicitColorKey)].strongVar})`;
export const categoryTileColor = (code, explicitColorKey) => `var(${COLOR_TOKENS[resolveColorKey(code, explicitColorKey)].softVar})`;

// Localized display label for a canonical system category. Falls back
// to the server's own `name` for anything not in the catalog above --
// never blank, never a guessed translation for text nobody wrote.
export const categoryLabel = (t, code, fallbackName) => {
  const meta = CATEGORY_PRESENTATION[code];
  return meta ? t(meta.labelKey) : fallbackName;
};
