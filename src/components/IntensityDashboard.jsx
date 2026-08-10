import { useMemo } from "react";
import { rankDepartmentIntensity } from "../lib/intensity";

export function IntensityDashboard({ quake }) {
  const ranked = useMemo(() => (quake ? rankDepartmentIntensity(quake) : []), [quake]);

  if (!quake) return null;

  return (
    <section className="intensity-section">
      <div className="intensity-header">
        <h2>Intensidad estimada por departamento</h2>
        <p className="intensity-subtitle">
          Para el último sismo: magnitud {quake.magnitude}, {quake.datetime}
        </p>
      </div>

      <div className="intensity-grid">
        {ranked.map((d, i) => (
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
