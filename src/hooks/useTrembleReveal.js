import { useCallback, useRef, useState } from "react";

const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Usa un callback ref (no useEffect) a propósito: varios de los dashboards
// que usan esto renderizan `null` mientras cargan y solo montan la sección
// real después, en el mismo componente. Un useEffect con [] solo corre una
// vez en el primer render y se perdería ese nodo tardío; el callback ref se
// dispara siempre que el nodo real aparece, sin importar en qué render sea.
export function useTrembleReveal() {
  const [visible, setVisible] = useState(reducedMotion);
  const observerRef = useRef(null);

  const ref = useCallback((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return { ref, className: `tremble-reveal${visible ? " tremble-reveal-visible" : ""}` };
}
