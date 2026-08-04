export function StatTile({ label, value, accent = false, wide = false }) {
  return (
    <div className={`stat-tile ${accent ? "stat-tile-accent" : ""} ${wide ? "stat-tile-wide" : ""}`}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value}</span>
    </div>
  );
}
