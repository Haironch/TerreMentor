import { useMemo, useState } from "react";
import { rankDepartmentIntensity } from "../lib/intensity";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

const COLLAPSED_COUNT = 6;

export function IntensityDashboard({ quake }) {
  const [expanded, setExpanded] = useState(false);
  const ranked = useMemo(() => (quake ? rankDepartmentIntensity(quake) : []), [quake]);
  const tremble = useTrembleReveal();

  if (!quake) return null;

  const visible = expanded ? ranked : ranked.slice(0, COLLAPSED_COUNT);
  const hasMore = ranked.length > COLLAPSED_COUNT;

  return (
    <section ref={tremble.ref} className={`intensity-section ${tremble.className}`}>
      <div className="intensity-header">
        <h2>Intensidad estimada por departamento</h2>
        <p className="intensity-subtitle">
          Para el último sismo: magnitud {quake.magnitude}, {quake.datetime}
        </p>
      </div>

      <div className="intensity-grid">
        {visible.map((d, i) => (
          <div key={d.name} className="intensity-chip" style={{ "--level-color": d.level.color }}>
            <span className="intensity-chip-rank">{i + 1}</span>
            <div className="intensity-chip-body">
              <span className="intensity-chip-name">{d.name}</span>
              <span className="intensity-chip-level">{d.level.label}</span>
            </div>
            <span className="intensity-chip-distance">{Math.round(d.distanceKm)} km</span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="intensity-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos" : `Ver los ${ranked.length} departamentos`}
          <span className={`intensity-toggle-chevron${expanded ? " intensity-toggle-chevron-up" : ""}`}>▾</span>
        </button>
      )}

      <p className="intensity-note">
        Estimación aproximada basada en magnitud, profundidad y distancia (escala de Mercalli
        Modificada) — no es un reporte oficial de daños ni de afectación. Ante un sismo fuerte,
        sigue los canales oficiales de{" "}
        <a href="https://conred.gob.gt" target="_blank" rel="noreferrer">
          CONRED
        </a>
        .
      </p>
    </section>
  );
}
