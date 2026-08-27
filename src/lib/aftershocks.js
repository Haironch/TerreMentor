import { haversineKm } from "./geo";
import { parseGtDatetime } from "./time";

const RADIUS_KM = 50;
const MIN_MAINSHOCK_MAGNITUDE = 3.5;

// Detección simple por cercanía: toma el sismo más grande del set (dentro de
// un umbral mínimo) como "principal", y cuenta los sismos posteriores dentro
// de un radio fijo como su secuencia. No es un algoritmo oficial de
// declustering de réplicas (eso requiere modelos estadísticos más
// complejos) — es una heurística honesta de espacio + tiempo.
export function detectAftershockSequence(quakes) {
  if (!quakes?.length) return null;

  const candidates = quakes.filter((q) => q.magnitude >= MIN_MAINSHOCK_MAGNITUDE);
  if (!candidates.length) return null;

  const mainshock = candidates.reduce((max, q) => (q.magnitude > max.magnitude ? q : max));
  const mainshockTime = parseGtDatetime(mainshock.datetime);

  const aftershocks = quakes
    .filter((q) => q.id !== mainshock.id)
    .filter((q) => parseGtDatetime(q.datetime) > mainshockTime)
    .filter((q) => haversineKm(q.lat, q.lon, mainshock.lat, mainshock.lon) <= RADIUS_KM)
    .sort((a, b) => parseGtDatetime(a.datetime) - parseGtDatetime(b.datetime));

  if (!aftershocks.length) return null;

  const lastTime = parseGtDatetime(aftershocks[aftershocks.length - 1].datetime);
  const hoursSinceLast = (Date.now() - lastTime) / (1000 * 60 * 60);

  return { mainshock, aftershocks, radiusKm: RADIUS_KM, hoursSinceLast };
}
