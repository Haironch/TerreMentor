export function StatTile({ label, value, accent = false }) {
  return (
    <div className={`stat-tile ${accent ? "stat-tile-accent" : ""}`}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value}</span>
    </div>
  );
}
