import { rankZones } from "../lib/zones";

export function ZoneRanking({ quakes }) {
  const ranked = rankZones(quakes, 5);
  const max = ranked[0]?.count ?? 1;

  return (
    <div className="chart-card">
      <h4>Zonas con más actividad</h4>
      {ranked.length === 0 ? (
        <p className="status-msg">Sin datos para este rango.</p>
      ) : (
        <ol className="zone-ranking">
          {ranked.map((zone, i) => (
            <li key={zone.name} className="zone-ranking-row">
              <span className="zone-ranking-pos">{i + 1}</span>
              <span className="zone-ranking-name">{zone.name}</span>
              <span className="zone-ranking-track">
                <span className="zone-ranking-fill" style={{ width: `${(zone.count / max) * 100}%` }} />
              </span>
              <span className="zone-ranking-count">{zone.count}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="zone-ranking-note">Aproximado, por cercanía a la cabecera departamental más cercana.</p>
    </div>
  );
}
