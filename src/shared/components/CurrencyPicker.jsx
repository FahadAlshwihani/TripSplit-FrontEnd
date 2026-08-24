import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCurrencyCatalog from './useCurrencyCatalog';
import { CURRENCY_SEARCH_ALIASES_AR } from './currencySearchAliases';
import './currencyPicker.css';

const normalize = (value) => (value || '').toString().toLowerCase();

const matchesQuery = (currency, query, isArabic) => {
  if (!query) return true;
  const needle = normalize(query);
  if (normalize(currency.code).includes(needle)) return true;
  if (normalize(currency.name).includes(needle)) return true;
  if (normalize(currency.symbol).includes(needle)) return true;
  if (currency.countries.some((country) => normalize(country.name).includes(needle))) return true;
  if (isArabic) {
    const trimmed = query.trim();
    const aliases = CURRENCY_SEARCH_ALIASES_AR[currency.code] || [];
    if (aliases.some((alias) => alias.includes(trimmed) || trimmed.includes(alias))) return true;
  }
  return false;
};

const formatCollapsed = (currency) => (currency ? `${currency.countries[0]?.flag || ''} ${currency.code} (${currency.symbol})`.trim() : '');

/*
  Searchable currency combobox — the whole catalog (fetched once, cached
  module-wide via useCurrencyCatalog) is filtered locally on every
  keystroke, never re-fetched. Matches ISO code, English name, symbol,
  representative country name, and (in Arabic) a small curated alias list
  (see currencySearchAliases.js) so "Saudi"/"السعودية"/"ريال" all resolve
  to SAR. Full combobox/listbox ARIA + arrow-key/Enter/Escape support —
  see the keydown handler below.
*/
const CurrencyPicker = ({ id, value, onChange, label, required }) => {
  const { t, i18n } = useTranslation();
  const { currencies, error } = useCurrencyCatalog();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const selected = useMemo(() => (currencies || []).find((currency) => currency.code === value) || null, [currencies, value]);

  const filtered = useMemo(() => {
    if (!open || !currencies) return [];
    const isArabic = i18n.language === 'ar';
    return currencies.filter((currency) => matchesQuery(currency, query, isArabic));
  }, [currencies, query, open, i18n.language]);

  useEffect(() => { setActiveIndex(0); }, [query, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const openList = () => setOpen(true);
  const selectCurrency = (currency) => {
    onChange(currency.code);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[activeIndex]) selectCurrency(filtered[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }
  };

  const listboxId = `${id}-listbox`;
  const activeOption = filtered[activeIndex];

  return (
    <div className="currency-picker" ref={containerRef}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOption ? `${id}-option-${activeOption.code}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        className="currency-picker__input"
        value={open ? query : formatCollapsed(selected)}
        placeholder={t('createTrip.currencySearchPlaceholder')}
        onFocus={openList}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
        required={required}
      />
      <i className="bi bi-chevron-down currency-picker__chevron" aria-hidden="true" />
      {open && (
        <ul className="currency-picker__listbox" role="listbox" id={listboxId} aria-label={label}>
          {!currencies && !error && <li className="currency-picker__empty">{t('common.loading')}</li>}
          {currencies && filtered.length === 0 && <li className="currency-picker__empty">{t('createTrip.currencyNoResults')}</li>}
          {filtered.map((currency, index) => (
            <li
              key={currency.code}
              id={`${id}-option-${currency.code}`}
              role="option"
              aria-selected={currency.code === value}
              className={`currency-picker__option${index === activeIndex ? ' is-active' : ''}${currency.code === value ? ' is-selected' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => { event.preventDefault(); selectCurrency(currency); }}
            >
              <span className="currency-picker__flag" aria-hidden="true">{currency.countries[0]?.flag}</span>
              <span className="currency-picker__text">
                <span className="currency-picker__country">{currency.countries[0]?.name}</span>
                <span className="currency-picker__detail">
                  <bdi className="currency-picker__code">{currency.code}</bdi> — {currency.name} ({currency.symbol})
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="currency-picker__error text-copy-sm" role="alert">{t('createTrip.currencyLoadError')}</p>}
    </div>
  );
};

export default CurrencyPicker;
