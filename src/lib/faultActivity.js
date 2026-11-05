import { nearestMappedFault, nearestTrench } from "./nearestFault";
import { parseGtDatetime } from "./time";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

// Hasta qué distancia un sismo se cuenta como "cerca" de una falla.
// - Fallas terrestres: 30 km. Más lejos ya no es razonable atribuírselo.
// - Fosa Mesoamericana: los sismos de subducción ocurren tierra adentro de la
//   línea de la fosa (la placa se hunde inclinada), a 50–150 km de ella, así
//   que ahí el radio es mucho mayor.
export const MAX_FAULT_DISTANCE_KM = 30;
export const MAX_TRENCH_DISTANCE_KM = 150;

export const SUBDUCTION_LABEL = "Zona de subducción (Fosa Mesoamericana)";
export const UNASSIGNED_LABEL = "Lejos de fallas mapeadas";

// Umbrales de actividad observada — NO son niveles de riesgo. Son solo
// para colorear cuántos sismos cayeron cerca de una falla en un día dado.
export const ACTIVITY_THRESHOLDS = { medium: 2, high: 5 };

export function activityLevelFor(count) {
  if (count <= 0) return "none";
  if (count >= ACTIVITY_THRESHOLDS.high) return "high";
  if (count >= ACTIVITY_THRESHOLDS.medium) return "medium";
  return "low";
}

// A qué grupo pertenece un sismo: la falla terrestre si está a ≤30 km; si no,
// la zona de subducción si está a ≤150 km de la fosa; si no, ninguno.
export function faultGroupFor(lat, lon, geologia) {
  const fault = nearestMappedFault(lat, lon, geologia);
  if (fault && fault.distanceKm <= MAX_FAULT_DISTANCE_KM) return fault.name;

  const trench = nearestTrench(lat, lon, geologia);
  if (trench && trench.distanceKm <= MAX_TRENCH_DISTANCE_KM) return SUBDUCTION_LABEL;

  return UNASSIGNED_LABEL;
}

function gtDateString(ts) {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });
}

function shortDate(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("es-GT", { day: "numeric", month: "short" });
}

// Agrupa los sismos de la semana por falla, con un conteo diario. Es
// actividad observada (cuántos sismos cayeron cerca de cada falla) — no mide
// "presión acumulada" ni nada predictivo.
//
// Los 7 días terminan en el último día que traen los datos (no en "hoy"),
// porque INSIVUMEH publica con retraso: así no se pierde el primer día de la
// semana ni aparece un "hoy" vacío que parezca un día tranquilo.
export function groupActivityByFault(quakes, geologia) {
  if (!quakes?.length || !geologia) return null;

  const withTime = quakes.map((q) => ({ q, time: parseGtDatetime(q.datetime) })).filter((x) => !Number.isNaN(x.time));
  if (!withTime.length) return null;

  const latest = Math.max(...withTime.map((x) => x.time));
  const dayKeys = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    dayKeys.push(gtDateString(latest - i * DAY_MS));
  }
  const todayKey = gtDateString(Date.now());

  const byFault = new Map();
  for (const { q, time } of withTime) {
    const dayIndex = dayKeys.indexOf(gtDateString(time));
    if (dayIndex === -1) continue;

    const name = faultGroupFor(q.lat, q.lon, geologia);
    if (!byFault.has(name)) {
      byFault.set(name, { faultName: name, total: 0, counts: dayKeys.map(() => 0) });
    }
    const entry = byFault.get(name);
    entry.total += 1;
    entry.counts[dayIndex] += 1;
  }

  const faults = [...byFault.values()]
    .map((entry) => {
      const days = dayKeys.map((key, i) => ({
        key,
        count: entry.counts[i],
        label:
          key === todayKey
            ? "hoy"
            : new Date(`${key}T12:00:00`).toLocaleDateString("es-GT", { weekday: "short" }).replace(".", ""),
        level: activityLevelFor(entry.counts[i]),
      }));
      return {
        faultName: entry.faultName,
        total: entry.total,
        days,
        peak: Math.max(...entry.counts),
        unassigned: entry.faultName === UNASSIGNED_LABEL,
      };
    })
    // Más activas primero; "Lejos de fallas mapeadas" siempre al final.
    .sort((a, b) => a.unassigned - b.unassigned || b.total - a.total);

  return {
    faults,
    // Máximo diario entre todas las fallas, para que las barras usen una sola escala.
    maxDaily: Math.max(1, ...faults.map((f) => f.peak)),
    total: faults.reduce((sum, f) => sum + f.total, 0),
    rangeLabel: `${shortDate(dayKeys[0])} – ${shortDate(dayKeys[WINDOW_DAYS - 1])}`,
  };
}
