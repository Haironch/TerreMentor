import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 45 * 1000;

export function useSismos() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async ({ force = false } = {}) => {
    if (force) setRefreshing(true);
    try {
      const res = await fetch(force ? "/api/sismos?force=1" : "/api/sismos");
      const json = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error(json.error || "Error al cargar datos");
      setData(json);
      setError(null);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [load]);

  const refetch = useCallback(() => load({ force: true }), [load]);

  return { data, error, loading, refreshing, refetch };
}
