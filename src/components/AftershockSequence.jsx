import { useMemo, useState } from "react";
import { detectAftershockSequence } from "../lib/aftershocks";
import { haversineKm } from "../lib/geo";
import { severityFor } from "../lib/severity";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

const COLLAPSED_COUNT = 8;

export function AftershockSequence({ quakes }) {
  const sequence = useMemo(() => detectAftershockSequence(quakes), [quakes]);
  const [expanded, setExpanded] = useState(false);
  const tremble = useTrembleReveal();

  if (!sequence) return null;

  const { mainshock, aftershocks, radiusKm } = sequence;
  const band = severityFor(mainshock.magnitude);
  const count = aftershocks.length;

  // Más recientes primero — lo más relevante para "¿sigue temblando?".
  const recentFirst = [...aftershocks].reverse();
  const visible = expanded ? recentFirst : recentFirst.slice(0, COLLAPSED_COUNT);
  const hasMore = count > COLLAPSED_COUNT;

  return (
    <section
      ref={tremble.ref}
      className={`aftershock-section ${tremble.className}`}
      style={{ "--band-color": band.color }}
    >
      <div className="aftershock-header">
        <h2>Secuencia de réplicas</h2>
        <p className="aftershock-subtitle">
          {count} sismo{count === 1 ? "" : "s"} detectado{count === 1 ? "" : "s"} a menos de{" "}
          {radiusKm} km del sismo principal — magnitud {mainshock.magnitude}, {mainshock.datetime}
        </p>
      </div>

      <div className="aftershock-list">
        {visible.map((q) => {
          const qBand = severityFor(q.magnitude);
          const distanceKm = Math.round(haversineKm(q.lat, q.lon, mainshock.lat, mainshock.lon));
          return (
            <div key={q.id} className="aftershock-row" style={{ "--level-color": qBand.color }}>
              <span className="aftershock-mag">{q.magnitude}</span>
              <div className="aftershock-body">
                <span className="aftershock-date">{q.datetime}</span>
                <span className="aftershock-distance">a {distanceKm} km del principal</span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button className="aftershock-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos" : `Ver las ${count} réplicas`}
          <span className={`aftershock-toggle-chevron${expanded ? " aftershock-toggle-chevron-up" : ""}`}>
            ▾
          </span>
        </button>
      )}

      <p className="aftershock-note">
        Detección simple por cercanía (menos de {radiusKm} km) y tiempo posterior al sismo más
        grande del último mes — no es un análisis oficial de réplicas, que requiere modelos
        estadísticos más complejos. Datos de INSIVUMEH.
      </p>
    </section>
  );
}
