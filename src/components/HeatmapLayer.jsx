import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Rampa secuencial de un solo tono (azul, claro→oscuro) en vez del clásico
// gradiente arcoíris de los heatmaps, para no confundir "densidad de
// actividad" con los colores de severidad por magnitud que ya usa el mapa.
const HEAT_GRADIENT = { 0.0: "#cde2fb", 0.3: "#6da7ec", 0.5: "#2a78d6", 0.7: "#1c5cab", 1.0: "#0d366b" };

export function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;

    const heat = L.heatLayer(points, {
      radius: 22,
      blur: 18,
      maxZoom: 10,
      gradient: HEAT_GRADIENT,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}
