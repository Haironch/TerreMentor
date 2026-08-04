import { useEffect, useState } from "react";

const POLL_MS = 15 * 60 * 1000;

export function useVolcanoStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/volcanes");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error || "Error al cargar el estado volcánico");
        setData(json);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return { data, error, loading };
}
