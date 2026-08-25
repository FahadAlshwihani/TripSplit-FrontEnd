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

export const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  return formatDate(start || end);
};
