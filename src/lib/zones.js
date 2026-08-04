import { haversineKm } from "./geo";
import { DEPARTMENTS } from "./departments";

// Alias por compatibilidad: este módulo agrupa sismos por cercanía a la
// cabecera departamental, usando la misma data que el selector de clima.
export const REFERENCE_ZONES = DEPARTMENTS;

export function nearestZone(lat, lon) {
  let best = REFERENCE_ZONES[0];
  let bestDist = Infinity;
  for (const zone of REFERENCE_ZONES) {
    const dist = haversineKm(lat, lon, zone.lat, zone.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = zone;
    }
  }
  return best.name;
}

export function rankZones(quakes, limit = 5) {
  const counts = new Map();
  for (const q of quakes) {
    const zone = nearestZone(q.lat, q.lon);
    counts.set(zone, (counts.get(zone) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
