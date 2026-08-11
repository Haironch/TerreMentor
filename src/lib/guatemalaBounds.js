// Caja delimitadora aproximada de Guatemala (con margen para zonas
// fronterizas) — suficiente para decidir si mostrar el panel "Cerca de ti".
const BOUNDS = { minLat: 13.5, maxLat: 17.9, minLon: -92.3, maxLon: -88.0 };

export function isWithinGuatemala(lat, lon) {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;
}
