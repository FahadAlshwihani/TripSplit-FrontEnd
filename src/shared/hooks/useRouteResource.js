import { useCallback, useEffect, useRef, useState } from 'react';
import { isRequestCancelled } from '../../api/errors';

const emptyValue = (value) => value == null
  || (Array.isArray(value) && value.length === 0)
  || (Array.isArray(value?.results) && value.results.length === 0);

export default function useRouteResource(loader, key) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const stableKey = JSON.stringify(key);
  const controllerRef = useRef(null);
  const generationRef = useRef(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    void stableKey;
    controllerRef.current?.abort();
    const controller = new AbortController();
    const generation = ++generationRef.current;
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current(controller.signal);
      if (generation === generationRef.current && !controller.signal.aborted) setData(result);
    } catch (reason) {
      if (!isRequestCancelled(reason) && generation === generationRef.current) setError(reason);
    } finally {
      if (generation === generationRef.current && !controller.signal.aborted) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }, [stableKey]);

  useEffect(() => {
    load();
    return () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [load]);

  const loadMore = useCallback(async (pageLoader, merge) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    const generation = ++generationRef.current;
    controllerRef.current = controller;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await pageLoader(controller.signal);
      if (generation === generationRef.current && !controller.signal.aborted) {
        setData((current) => merge(current, page));
      }
    } catch (reason) {
      if (!isRequestCancelled(reason) && generation === generationRef.current) setError(reason);
    } finally {
      if (generation === generationRef.current && !controller.signal.aborted) {
        setLoadingMore(false);
        controllerRef.current = null;
      }
    }
  }, []);

  return {
    data,
    setData,
    loading,
    loadingMore,
    error,
    isEmpty: !loading && !error && emptyValue(data),
    retry: load,
    loadMore,
  };
}
