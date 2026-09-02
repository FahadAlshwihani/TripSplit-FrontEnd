import React from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_CALLING_CODES } from '../data/countryCallingCodes';

/*
  One coherent phone control -- a country-code select flush against a
  number input, not two visually unrelated fields. The number itself
  stays LTR (digits read the same regardless of page direction, same
  convention as dates/currency codes elsewhere in the app); the select
  and input are one bordered unit whose internal divider is a logical
  border (inline-end in the outer wrapper's own direction), so it
  mirrors correctly under RTL with no separate markup.
*/
const PhoneField = ({ id, countryCode, onCountryCodeChange, number, onNumberChange, error, disabled }) => {
  const { t } = useTranslation();
  return (
    <div className="phone-field">
      <div className={`phone-field__group${error ? ' phone-field__group--error' : ''}`}>
        <select
          id={`${id}-country`}
          className="phone-field__code"
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          aria-label={t('support.form.phoneCountryCode')}
          disabled={disabled}
        >
          {COUNTRY_CALLING_CODES.map((country) => (
            <option key={country.code} value={country.dial}>{country.flag} {country.dial}</option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          dir="ltr"
          required
          className="phone-field__number"
          value={number}
          onChange={(event) => onNumberChange(event.target.value)}
          aria-label={t('support.form.phone')}
          disabled={disabled}
        />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
};

export default PhoneField;
