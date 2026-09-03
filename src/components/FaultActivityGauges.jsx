import { useMemo, useState } from "react";
import { groupActivityByFault, activityLevelFor } from "../lib/faultActivity";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

const LEVEL_COLORS = { low: "#0ca30c", medium: "#fab219", high: "#d03b3b" };
const COLLAPSED_COUNT = 4;

export function FaultActivityGauges({ quakes, geologia }) {
  const faults = useMemo(() => groupActivityByFault(quakes, geologia), [quakes, geologia]);
  const [expanded, setExpanded] = useState(false);
  const tremble = useTrembleReveal();

  if (!faults.length) return null;

  const visible = expanded ? faults : faults.slice(0, COLLAPSED_COUNT);
  const hasMore = faults.length > COLLAPSED_COUNT;

  return (
    <section ref={tremble.ref} className={`fault-activity-section ${tremble.className}`}>
      <div className="fault-activity-header">
        <h2>Actividad semanal por falla</h2>
        <p className="fault-activity-subtitle">
          Cuántos sismos se registraron cerca de cada falla en los últimos 7 días — es actividad
          observada, no una medición de riesgo ni de "presión acumulada".
        </p>
      </div>

      <div className="fault-activity-list">
        {visible.map((f) => (
          <div
            key={f.faultName}
            className="fault-gauge"
            style={{ "--peak-color": LEVEL_COLORS[activityLevelFor(f.peak)] }}
          >
            <div className="fault-gauge-header">
              <span className="fault-gauge-name">{f.faultName}</span>
              <span className="fault-gauge-total">{f.total} esta semana</span>
            </div>
            <div className="fault-gauge-strip">
              {f.days.map((d) => (
                <div key={d.key} className="fault-gauge-day">
                  <div
                    className="fault-gauge-bar"
                    style={{
                      "--bar-color": LEVEL_COLORS[d.level],
                      height: `${Math.max(8, Math.min(100, (d.count / Math.max(f.peak, 1)) * 100))}%`,
                    }}
                    title={`${d.count} sismo${d.count === 1 ? "" : "s"}`}
                  />
                  <span className="fault-gauge-day-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="fault-activity-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos" : `Ver las ${faults.length} fallas`}
          <span className={`fault-activity-toggle-chevron${expanded ? " fault-activity-toggle-chevron-up" : ""}`}>
            ▾
          </span>
        </button>
      )}

      <p className="fault-activity-note">
        Verde = 0–1 sismo ese día cerca de esa falla, naranja = 2–4, rojo = 5+. Es solo conteo de
        eventos — más actividad no significa que un sismo grande esté por pasar, ni que el riesgo
        haya bajado. Datos de INSIVUMEH.
      </p>
    </section>
  );
}
