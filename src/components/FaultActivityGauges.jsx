import { useMemo, useState } from "react";
import {
  groupActivityByFault,
  activityLevelFor,
  MAX_FAULT_DISTANCE_KM,
  MAX_TRENCH_DISTANCE_KM,
} from "../lib/faultActivity";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

const LEVEL_COLORS = { none: "var(--border-strong)", low: "#0ca30c", medium: "#fab219", high: "#d03b3b" };
const COLLAPSED_COUNT = 4;
const MIN_BAR_PCT = 10;

// Escala raíz cuadrada y común a todas las fallas: un enjambre de 50 sismos
// en un día no aplasta a las fallas con 2–3, pero se siguen pudiendo comparar.
function barHeightPct(count, maxDaily) {
  if (count <= 0) return 0;
  return Math.max(MIN_BAR_PCT, Math.sqrt(count / maxDaily) * 100);
}

export function FaultActivityGauges({ quakes, geologia }) {
  const activity = useMemo(() => groupActivityByFault(quakes, geologia), [quakes, geologia]);
  const [expanded, setExpanded] = useState(false);
  const tremble = useTrembleReveal();

  if (!activity?.faults.length) return null;

  const { faults, maxDaily, total, rangeLabel } = activity;
  const visible = expanded ? faults : faults.slice(0, COLLAPSED_COUNT);
  const hasMore = faults.length > COLLAPSED_COUNT;

  return (
    <section ref={tremble.ref} className={`fault-activity-section ${tremble.className}`}>
      <div className="fault-activity-header">
        <h2>Actividad semanal por falla</h2>
        <p className="fault-activity-subtitle">
          Cuántos sismos se registraron cerca de cada falla del {rangeLabel} ({total} sismos) — es actividad
          observada, no una medición de riesgo ni de "presión acumulada".
        </p>
      </div>

      <div className="fault-activity-list">
        {visible.map((f) => (
          <div
            key={f.faultName}
            className={`fault-gauge${f.unassigned ? " fault-gauge-unassigned" : ""}`}
            style={{ "--peak-color": LEVEL_COLORS[activityLevelFor(f.peak)] }}
          >
            <div className="fault-gauge-header">
              <span className="fault-gauge-name">{f.faultName}</span>
              <span className="fault-gauge-total">
                {f.total} sismo{f.total === 1 ? "" : "s"}
              </span>
            </div>
            <div className="fault-gauge-strip">
              {f.days.map((d) => (
                <div
                  key={d.key}
                  className="fault-gauge-day"
                  title={`${d.key}: ${d.count} sismo${d.count === 1 ? "" : "s"}`}
                >
                  <div className="fault-gauge-track">
                    <span className={`fault-gauge-count${d.count === 0 ? " fault-gauge-count-zero" : ""}`}>
                      {d.count}
                    </span>
                    {d.count > 0 ? (
                      <div
                        className="fault-gauge-bar"
                        style={{ "--bar-color": LEVEL_COLORS[d.level], "--h": barHeightPct(d.count, maxDaily) / 100 }}
                      />
                    ) : (
                      <div className="fault-gauge-bar-empty" />
                    )}
                  </div>
                  <span className={`fault-gauge-day-label${d.label === "hoy" ? " fault-gauge-day-today" : ""}`}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="fault-activity-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos" : `Ver los ${faults.length} grupos`}
          <span className={`fault-activity-toggle-chevron${expanded ? " fault-activity-toggle-chevron-up" : ""}`}>
            ▾
          </span>
        </button>
      )}

      <p className="fault-activity-note">
        "Cerca" = a {MAX_FAULT_DISTANCE_KM} km o menos de la falla. La zona de subducción cuenta sismos hasta{" "}
        {MAX_TRENCH_DISTANCE_KM} km tierra adentro de la Fosa Mesoamericana, porque ahí es donde ocurren. Gris = sin
        sismos ese día, verde = 1, naranja = 2–4, rojo = 5+. Todas las barras usan la misma escala. Es solo conteo de
        eventos — más actividad no significa que un sismo grande esté por pasar, ni que el riesgo haya bajado. Datos de
        INSIVUMEH.
      </p>
    </section>
  );
}
