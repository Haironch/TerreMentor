// Cabeceras departamentales de Guatemala (coordenadas aproximadas). Se usan
// solo como referencia para agrupar sismos por cercanía, no como límites
// administrativos reales — muchos sismos caen en el mar o fuera del país, y
// simplemente se atribuyen a la cabecera más cercana.
export const REFERENCE_ZONES = [
  { name: "Guatemala", lat: 14.6349, lon: -90.5069 },
  { name: "El Progreso", lat: 14.8447, lon: -90.0705 },
  { name: "Sacatepéquez", lat: 14.5586, lon: -90.7295 },
  { name: "Chimaltenango", lat: 14.6611, lon: -90.8207 },
  { name: "Escuintla", lat: 14.305, lon: -90.785 },
  { name: "Santa Rosa", lat: 14.2753, lon: -90.301 },
  { name: "Sololá", lat: 14.7737, lon: -91.1839 },
  { name: "Totonicapán", lat: 14.9114, lon: -91.3617 },
  { name: "Quetzaltenango", lat: 14.8447, lon: -91.5183 },
  { name: "Suchitepéquez", lat: 14.5347, lon: -91.5083 },
  { name: "Retalhuleu", lat: 14.5361, lon: -91.6781 },
  { name: "San Marcos", lat: 14.9639, lon: -91.7947 },
  { name: "Huehuetenango", lat: 15.3197, lon: -91.4711 },
  { name: "Quiché", lat: 15.0281, lon: -91.1497 },
  { name: "Baja Verapaz", lat: 15.1064, lon: -90.3183 },
  { name: "Alta Verapaz", lat: 15.47, lon: -90.3714 },
  { name: "Petén", lat: 16.9284, lon: -89.8916 },
  { name: "Izabal", lat: 15.7275, lon: -88.5942 },
  { name: "Zacapa", lat: 14.9722, lon: -89.5306 },
  { name: "Chiquimula", lat: 14.7997, lon: -89.5459 },
  { name: "Jalapa", lat: 14.6333, lon: -89.9889 },
  { name: "Jutiapa", lat: 14.2911, lon: -89.8956 },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

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
