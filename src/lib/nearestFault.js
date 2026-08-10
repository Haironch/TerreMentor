import { FAULT_LABELS, TRENCH_LABEL } from "./faultNames";

const KM_PER_DEG_LAT = 111.32;

// Proyecta a un plano local en km, centrado en el punto de referencia — más
// que suficiente de precisión para distancias cortas dentro de Guatemala.
function toLocalKm(lat, lon, originLat) {
  const kmPerDegLon = KM_PER_DEG_LAT * Math.cos((originLat * Math.PI) / 180);
  return [lon * kmPerDegLon, lat * KM_PER_DEG_LAT];
}

function pointToSegmentDistanceKm(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function minDistanceToLineKm(lat, lon, coordinates, originLat) {
  const [px, py] = toLocalKm(lat, lon, originLat);
  let best = Infinity;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [alon, alat] = coordinates[i];
    const [blon, blat] = coordinates[i + 1];
    const [ax, ay] = toLocalKm(alat, alon, originLat);
    const [bx, by] = toLocalKm(blat, blon, originLat);
    const d = pointToSegmentDistanceKm(px, py, ax, ay, bx, by);
    if (d < best) best = d;
  }
  return best;
}

export function nearestFault(lat, lon, geologia) {
  if (!geologia) return null;

  let best = null;

  geologia.fallas.features.forEach((feature, i) => {
    const distanceKm = minDistanceToLineKm(lat, lon, feature.geometry.coordinates, lat);
    if (!best || distanceKm < best.distanceKm) {
      best = { name: FAULT_LABELS[i], distanceKm };
    }
  });

  geologia.fosaMesoamericana.features.forEach((feature) => {
    const distanceKm = minDistanceToLineKm(lat, lon, feature.geometry.coordinates, lat);
    if (!best || distanceKm < best.distanceKm) {
      best = { name: TRENCH_LABEL, distanceKm };
    }
  });

  return best;
}
