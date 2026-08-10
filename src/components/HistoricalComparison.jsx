import { useMemo } from "react";
import { HISTORICAL_QUAKES } from "../lib/historicalQuakes";
import { severityFor } from "../lib/severity";
import { describeEnergyComparison } from "../lib/energyComparison";

const MAX_SCALE = 9;

export function HistoricalComparison({ quake }) {
  const rows = useMemo(() => {
    if (!quake) return [];
    const current = {
      id: "current",
      label: "Este sismo",
      date: quake.datetime,
      magnitude: quake.magnitude,
      note: null,
      isCurrent: true,
    };
    return [current, ...HISTORICAL_QUAKES].sort((a, b) => b.magnitude - a.magnitude);
  }, [quake]);

  if (!quake) return null;

  return (
    <section className="historical-section">
      <div className="historical-header">
        <h2>Comparación con sismos históricos</h2>
        <p className="historical-subtitle">
          Cómo se compara el sismo actual (magnitud {quake.magnitude}) con eventos de referencia
        </p>
      </div>

      <div className="historical-list">
        {rows.map((row) => {
          const width = Math.min(100, (row.magnitude / MAX_SCALE) * 100);
          const color = severityFor(row.magnitude).color;
          return (
            <div key={row.id} className={`historical-row ${row.isCurrent ? "historical-row-current" : ""}`}>
              <div className="historical-row-labels">
                <span className="historical-row-name">
                  {row.label}
                  {row.isCurrent && <span className="historical-row-badge">actual</span>}
                </span>
                <span className="historical-row-date">{row.date}</span>
              </div>
              <div className="historical-bar-track">
                <div className="historical-bar-fill" style={{ width: `${width}%`, background: color }} />
                <span className="historical-bar-value">{row.magnitude}</span>
              </div>
              {row.note && <p className="historical-row-note">{row.note}</p>}
              {!row.isCurrent && (
                <p className="historical-row-note">
                  Ese sismo {describeEnergyComparison(row.magnitude, quake.magnitude)} que el sismo actual.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="historical-note">
        Magnitudes de eventos históricos según registros públicos de referencia. La comparación de
        energía usa la relación estándar de Gutenberg-Richter (~10^1.5 por punto de magnitud) — es
        una aproximación educativa, no un análisis sismológico oficial.
      </p>
    </section>
  );
}
