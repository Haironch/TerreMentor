import { useEffect, useState } from "react";

// Fallas principales y Fosa Mesoamericana: datos geológicos estáticos
// extraídos una sola vez de INSIVUMEH (no cambian con el tiempo, así que se
// sirven como archivo propio en vez de volver a scrapearlos).
export function useGeologia() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/geologia.json")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
