import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Leaflet calcula el tamaño del mapa una sola vez al montarse. Si en ese
// momento el layout todavía se está acomodando (fuentes cargando, el
// contenedor cambiando de tamaño), el mapa queda con dimensiones
// incorrectas: se ve desplazado hacia un lado y el zoom no coincide con lo
// que se muestra. Esto es más notorio en Safari/iOS que en Chrome de
// escritorio. La solución estándar es recalcular el tamaño cuando el
// contenedor realmente termine de asentarse.
export function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();

    const raf = requestAnimationFrame(invalidate);
    const timeout = setTimeout(invalidate, 300);

    const resizeObserver = new ResizeObserver(invalidate);
    resizeObserver.observe(container);

    window.addEventListener("orientationchange", invalidate);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", invalidate);
    };
  }, [map]);

  return null;
}
