import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapAutoResize } from "./MapAutoResize";
import { BaseMapLayers } from "./BaseMapLayers";

const PATH_COLOR = "#6b7480";

function radiusFor(magnitude) {
  return Math.max(5, (magnitude - 6) * 10);
}

// El prop `bounds` de MapContainer solo se aplica una vez, al construirse el
// mapa — si en ese instante el contenedor todavía no tiene su tamaño real
// (mismo problema que resuelve MapAutoResize), el fitBounds sale mal y todos
// los puntos quedan encimados en 0,0. Se recalcula a mano una vez que el
// contenedor ya se asentó.
function FitToPositions({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions?.length) return undefined;
    const fit = () => map.fitBounds(positions, { padding: [24, 24] });
    const raf = requestAnimationFrame(fit);
    const timeout = setTimeout(fit, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [map, positions]);

  return null;
}

export function WorldQuakesMap({ quakes, colorFor }) {
  if (!quakes?.length) return null;

  const chronological = [...quakes].sort((a, b) => new Date(a.time) - new Date(b.time));
  const path = chronological.map((q) => [q.lat, q.lon]);

  return (
    <div className="world-quakes-map">
      <MapContainer center={[10, 30]} zoom={2} scrollWheelZoom={false} worldCopyJump className="world-quakes-map-canvas">
        <MapAutoResize />
        <FitToPositions positions={path} />
        <BaseMapLayers />

        <Polyline positions={path} pathOptions={{ color: PATH_COLOR, weight: 1.5, opacity: 0.6, dashArray: "1, 6" }} />

        {chronological.map((q, i) => (
          <CircleMarker
            key={q.id}
            center={[q.lat, q.lon]}
            radius={radiusFor(q.magnitude)}
            pathOptions={{ color: colorFor(q.magnitude), fillColor: colorFor(q.magnitude), fillOpacity: 0.7, weight: 1.5 }}
          >
            <Popup>
              <strong>
                {i + 1}. Magnitud {q.magnitude}
              </strong>
              <br />
              {q.place}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
