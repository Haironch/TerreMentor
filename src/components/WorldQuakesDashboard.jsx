import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useWorldQuakes } from "../hooks/useWorldQuakes";
import { useQuakeYears } from "../hooks/useQuakeYears";
import { WorldQuakesMap } from "./WorldQuakesMap";

const gridColor = "#232a33";
const inkColor = "#6b7480";
const YEAR_BAR_COLOR = "#3987e5";
const YEAR_BAR_COLOR_PARTIAL = "rgba(57, 135, 229, 0.35)";

function YearsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const y = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>
        {y.year}
        {y.partial ? " (en curso)" : ""}
      </strong>
      <div>{y.count} sismos</div>
    </div>
  );
}

function QuakeYearsChart() {
  const { data, error, loading } = useQuakeYears();

  if (loading || error || !data?.years?.length) return null;

  return (
    <div className="world-quakes-chart">
      <h3>Comparativa por año</h3>
      <p className="world-quakes-subtitle">
        Cantidad de sismos de magnitud {data.minMagnitude}+ a nivel mundial, por año, según el USGS.
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.years} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis dataKey="year" tick={{ fill: inkColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: inkColor, fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip content={<YearsTooltip />} cursor={{ fill: gridColor }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.years.map((y) => (
              <Cell
                key={y.year}
                fill={y.partial ? YEAR_BAR_COLOR_PARTIAL : YEAR_BAR_COLOR}
                stroke={y.partial ? YEAR_BAR_COLOR : "none"}
                strokeDasharray={y.partial ? "4 3" : "0"}
                strokeWidth={y.partial ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="world-quakes-note">
        El año en curso se ve más claro y punteado — todavía no termina, así que no es comparable
        directo contra los años completos.
      </p>
    </div>
  );
}

// Escala propia para este dashboard: todos los sismos aquí son ≥6.5, así
// que las bandas de severidad pensadas para Guatemala (0–5) no sirven para
// diferenciarlos — necesitan su propia escala dentro del rango real.
const COLOR_STOPS = [
  { mag: 6.5, color: [250, 178, 25] }, // warning
  { mag: 7.2, color: [236, 131, 90] }, // serious
  { mag: 7.8, color: [208, 59, 59] }, // critical
  { mag: 8.5, color: [167, 139, 250] }, // violeta — "gran terremoto"
];

function magnitudeColor(mag) {
  if (mag <= COLOR_STOPS[0].mag) return rgb(COLOR_STOPS[0].color);
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (mag <= COLOR_STOPS[i].mag) {
      const a = COLOR_STOPS[i - 1];
      const b = COLOR_STOPS[i];
      const t = (mag - a.mag) / (b.mag - a.mag);
      const c = a.color.map((v, idx) => Math.round(v + (b.color[idx] - v) * t));
      return rgb(c);
    }
  }
  return rgb(COLOR_STOPS[COLOR_STOPS.length - 1].color);
}

function rgb([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
}

export function WorldQuakesDashboard() {
  const { data, error, loading } = useWorldQuakes();
  const [revealed, setRevealed] = useState(false);

  if (loading) return <div className="skeleton skeleton-card-sm" />;
  if (error || !data?.quakes?.length) return null;

  return (
    <section className="world-quakes-section">
      <div className="world-quakes-header">
        <h2>Los terremotos más grandes de {data.year}</h2>
        <p className="world-quakes-subtitle">
          Magnitud {data.minMagnitude}+ a nivel mundial — de menor a mayor, según el catálogo del USGS.
        </p>
      </div>

      <div className="world-quakes-list">
        {data.quakes.map((q, i) => (
          <a
            key={q.id}
            className="world-quake-row"
            style={{ "--level-color": magnitudeColor(q.magnitude) }}
            href={q.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="world-quake-rank">{i + 1}</span>
            <div className="world-quake-body">
              <span className="world-quake-place">{q.place}</span>
              <span className="world-quake-date">{formatFullDate(q.time)}</span>
            </div>
            <span className="world-quake-mag">{q.magnitude}</span>
          </a>
        ))}

        <button
          className={`world-quake-mystery${revealed ? " world-quake-mystery-revealed" : ""}`}
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? (
            <span className="world-quake-mystery-text">
              El que sigue, lo sabremos cuando pase. Nadie puede predecir con certeza cuándo ni dónde
              será el próximo terremoto grande — ni el USGS, ni nadie. Por eso importa estar
              preparados, no adivinar.
            </span>
          ) : (
            <>
              <span className="world-quake-mystery-mark">?</span>
              <span className="world-quake-mystery-label">El próximo</span>
            </>
          )}
        </button>
      </div>

      <div className="world-quakes-chart">
        <h3>Recorrido del año</h3>
        <WorldQuakesMap quakes={data.quakes} colorFor={magnitudeColor} />
      </div>

      <QuakeYearsChart />

      <p className="world-quakes-note">
        Datos en vivo del{" "}
        <a href="https://earthquake.usgs.gov" target="_blank" rel="noreferrer">
          USGS
        </a>{" "}
        (Servicio Geológico de EE. UU.), catálogo sísmico global de referencia — no sustituye fuentes
        oficiales locales de cada país.
      </p>
    </section>
  );
}
