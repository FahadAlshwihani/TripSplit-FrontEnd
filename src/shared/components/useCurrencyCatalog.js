import { useEffect, useRef, useState } from 'react';
import { getCurrencies } from '../../features/currencies/api/currenciesApi';

// Module-level cache + in-flight promise, shared across every mounted
// CurrencyPicker — the catalog is fetched once per page load no matter how
// many pickers are on screen, never per keystroke/render.
let cachedCurrencies = null;
let inFlight = null;

const fetchCurrencies = () => {
  if (cachedCurrencies) return Promise.resolve(cachedCurrencies);
  if (!inFlight) {
    inFlight = getCurrencies()
      .then((result) => { cachedCurrencies = result.currencies; return cachedCurrencies; })
      .finally(() => { inFlight = null; });
  }
  return inFlight;
};

// { currencies: [] | null (still loading), error }
const useCurrencyCatalog = () => {
  const [currencies, setCurrencies] = useState(cachedCurrencies);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!cachedCurrencies) {
      fetchCurrencies()
        .then((result) => { if (mountedRef.current) setCurrencies(result); })
        .catch((err) => { if (mountedRef.current) setError(err); });
    }
    return () => { mountedRef.current = false; };
  }, []);

  return { currencies, error };
};

export default useCurrencyCatalog;
