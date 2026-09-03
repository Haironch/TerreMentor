import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { detectAftershockSequence } from "../lib/aftershocks";
import { haversineKm } from "../lib/geo";
import { severityFor } from "../lib/severity";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

const COLLAPSED_COUNT = 8;
const gridColor = "#232a33";
const inkColor = "#6b7480";

function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{d.label}</strong>
      <div>{d.count} réplicas</div>
    </div>
  );
}

export function AftershockSequence({ quakes }) {
  const sequence = useMemo(() => detectAftershockSequence(quakes), [quakes]);
  const [expanded, setExpanded] = useState(false);
  const tremble = useTrembleReveal();

  if (!sequence) return null;

  const { mainshock, aftershocks, radiusKm, largestAftershock, bathsLawEstimate, dailyCounts } = sequence;
  const band = severityFor(mainshock.magnitude);
  const largestBand = severityFor(largestAftershock.magnitude);
  const count = aftershocks.length;

  // Más recientes primero — lo más relevante para "¿sigue temblando?".
  const recentFirst = [...aftershocks].reverse();
  const visible = expanded ? recentFirst : recentFirst.slice(0, COLLAPSED_COUNT);
  const hasMore = count > COLLAPSED_COUNT;
  const tickInterval = Math.max(0, Math.ceil(dailyCounts.length / 8) - 1);

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

      <div className="aftershock-bath">
        <p className="aftershock-bath-label">LEY DE BATH</p>
        <p className="aftershock-bath-text">
          En secuencias reales alrededor del mundo, la réplica más grande suele rondar magnitud{" "}
          <strong>{bathsLawEstimate}</strong> para un sismo principal de M{mainshock.magnitude} — es
          un promedio estadístico, no una predicción para este caso. Acá, la más grande registrada
          fue{" "}
          <strong style={{ color: largestBand.color }}>M{largestAftershock.magnitude}</strong>.
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

      <div className="aftershock-chart">
        <h3>Cómo bajan las réplicas con el tiempo</h3>
        <p className="aftershock-subtitle">
          La Ley de Omori describe cómo la frecuencia de réplicas decae de forma predecible tras el
          sismo principal — es el patrón que se ve abajo, con datos reales de esta secuencia.
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailyCounts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="label"
              tick={{ fill: inkColor, fontSize: 10 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis tick={{ fill: inkColor, fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<DayTooltip />} cursor={{ fill: gridColor }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} fill={band.color} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="aftershock-note">
        Detección simple por cercanía (menos de {radiusKm} km) y tiempo posterior al sismo más
        grande del último mes — no es un análisis oficial de réplicas, que requiere modelos
        estadísticos más complejos. Las leyes de Bath y Omori son patrones empíricos bien
        establecidos en sismología, no una predicción de lo que pasará después. Datos de
        INSIVUMEH.
      </p>
    </section>
  );
}
