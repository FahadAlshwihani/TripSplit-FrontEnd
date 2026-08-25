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
*/
const Money = ({ value, currency, className = '', currencyClassName = 'money__currency' }) => {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  const formatted = Number.isFinite(number)
    ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)
    : value;
  return (
    <bdi dir="ltr" className={className}>
      {formatted}
      {currency && <span className={currencyClassName}> {currency}</span>}
    </bdi>
  );
};

export default Money;
