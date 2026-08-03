import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function toDay(datetime) {
  return datetime.slice(0, 10);
}

function buildDailyCounts(quakes) {
  const counts = new Map();
  for (const q of quakes) {
    const day = toDay(q.datetime);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <div>{payload[0].value} sismos</div>
    </div>
  );
}

const barColor = "#3987e5";
const gridColor = "#232a33";
const inkColor = "#6b7480";

export function DailyCountChart({ quakes }) {
  const data = buildDailyCounts(quakes);

  return (
    <div className="chart-card">
      <h4>Sismos por día</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis dataKey="date" tick={{ fill: inkColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: inkColor, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: gridColor }} />
          <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
