import React from 'react';

/*
  Renders an authoritative server-computed amount (never recomputed
  here) as "<number> <currency>", with the whole thing wrapped in a
  <bdi dir="ltr"> isolate -- required so a digit string never gets
  reordered or split awkwardly inside surrounding RTL Arabic text (e.g.
  "SAR 6,000.00" must never render as "6,000.00 SAR القيمة" or similar).
  The currency code renders in its own smaller/muted span, matching the
  approved Stitch treatment (bold number, small supporting currency
  suffix) instead of one uniformly-sized string.

  Locale is pinned to 'en-US', not left as the browser's own configured
  locale: money needs a language-independent numeric identity (Western
  digits, comma grouping) so amounts stay instantly comparable and
  correctly aligned in ledger tables no matter what locale a member's
  device is set to -- an Arabic-locale browser can otherwise format
  Intl.NumberFormat(undefined, ...) output with Arabic-Indic digits.

  `variant` selects which of the two canonical numeric fonts (see
  typography.css) applies: "display" (default) for large/high-emphasis
  figures like the summary cards, "tabular" for small ledger/table rows.

  `signDisplay` defaults to "auto" (Intl's own default -- a "-" on
  negative values, nothing on positive/zero), matching every existing
  caller unchanged. Pass "exceptZero" for a context that explicitly
  needs a leading "+" on positive amounts (e.g. Settlements' "gets
  back" balance row) -- still the one canonical formatter, never a
  second ad-hoc Intl.NumberFormat call built to fake a sign.
*/
const Money = ({ value, currency, variant = 'display', className = '', currencyClassName = 'money__currency', signDisplay = 'auto' }) => {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  const formatted = Number.isFinite(number)
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay }).format(number)
    : value;
  const wrapperClassName = ['money', `money--${variant}`, className].filter(Boolean).join(' ');
  return (
    <bdi dir="ltr" className={wrapperClassName}>
      {formatted}
      {currency && <span className={currencyClassName}> {currency}</span>}
    </bdi>
  );
};

export default Money;
