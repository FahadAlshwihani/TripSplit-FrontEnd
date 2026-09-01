// Formats a decimal string/number as a grouped, locale-aware amount (never
// does its own arithmetic -- the value must already be the authoritative
// server-computed figure). `undefined` locale intentionally follows the
// same convention already used elsewhere in the app (see AccountTripRow's
// date formatting) -- the browser's own configured locale, not a value
// re-derived from i18n's current language.
export const formatMoney = (value, currencyCode) => {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  const formatted = Number.isFinite(number) ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number) : value;
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
};

export const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, options);
};

export const formatDateTime = (value, locale, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
  if (!value) return null;
  const language = locale?.startsWith('ar') ? 'ar-SA' : locale?.startsWith('en') ? 'en' : undefined;
  return new Intl.DateTimeFormat(language, options).format(new Date(value));
};

export const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  return formatDate(start || end);
};

const RELATIVE_TIME_DIVISIONS = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

// Locale-aware "8 minutes ago" / "قبل 8 دقائق" via Intl.RelativeTimeFormat --
// for a "how recent" row context (e.g. Governance's Join Requests), where a
// raw formatted timestamp is too dense/noisy for the primary row line.
export const formatRelativeTime = (value, locale) => {
  if (!value) return null;
  const language = locale?.startsWith('ar') ? 'ar-SA' : locale?.startsWith('en') ? 'en' : undefined;
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  let duration = (new Date(value).getTime() - Date.now()) / 1000;
  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) return rtf.format(Math.round(duration), division.unit);
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), 'year');
};
