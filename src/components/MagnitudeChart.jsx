import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITY_BANDS, severityFor } from "../lib/severity";

function buildTimeline(quakes) {
  return [...quakes]
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .map((q) => ({ ...q, color: severityFor(q.magnitude).color }));
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const q = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>Magnitud {q.magnitude}</strong>
      <div>{q.datetime}</div>
      <div>Profundidad: {q.depthKm ?? "?"} km</div>
    </div>
  );
}

const gridColor = "#232a33";
const inkColor = "#6b7480";

export function MagnitudeChart({ quakes }) {
  const data = buildTimeline(quakes);

  return (
    <div className="chart-card">
      <h4>Magnitud por sismo (ordenado en el tiempo)</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis dataKey="datetime" tick={false} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: inkColor, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: gridColor }} />
          <Bar dataKey="magnitude" radius={[4, 4, 0, 0]} maxBarSize={16}>
            {data.map((q) => (
              <Cell key={q.id} fill={q.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {SEVERITY_BANDS.map((band) => (
          <span key={band.key} className="chart-legend-item">
            <i style={{ background: band.color }} />
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
