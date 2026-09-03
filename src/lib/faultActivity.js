import { nearestFault } from "./nearestFault";
import { parseGtDatetime } from "./time";

const DAY_MS = 24 * 60 * 60 * 1000;

// Umbrales de actividad observada — NO son niveles de riesgo. Son solo
// para colorear cuántos sismos cayó cerca de una falla en un día dado.
export const ACTIVITY_THRESHOLDS = { medium: 2, high: 5 };

export function activityLevelFor(count) {
  if (count >= ACTIVITY_THRESHOLDS.high) return "high";
  if (count >= ACTIVITY_THRESHOLDS.medium) return "medium";
  return "low";
}

function gtDateString(ts) {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });
}

// Agrupa los sismos de los últimos 7 días por la falla más cercana, con un
// conteo diario por falla. Es actividad observada (cuántos sismos cayeron
// cerca de cada falla) — no mide "presión acumulada" ni nada predictivo.
export function groupActivityByFault(quakes, geologia) {
  if (!quakes?.length || !geologia) return [];

  const now = Date.now();
  const dayKeys = [];
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(gtDateString(now - i * DAY_MS));
  }

  const byFault = new Map();

  for (const q of quakes) {
    const fault = nearestFault(q.lat, q.lon, geologia);
    if (!fault) continue;

    const qTime = parseGtDatetime(q.datetime);
    const qDayStr = gtDateString(qTime);
    const dayIndex = dayKeys.indexOf(qDayStr);
    if (dayIndex === -1) continue;

    if (!byFault.has(fault.name)) {
      byFault.set(fault.name, {
        faultName: fault.name,
        total: 0,
        days: dayKeys.map((key) => ({ key, count: 0 })),
      });
    }
    const entry = byFault.get(fault.name);
    entry.total += 1;
    entry.days[dayIndex].count += 1;
  }

  return [...byFault.values()]
    .map((entry) => {
      const days = entry.days.map((d) => ({
        ...d,
        label: new Date(`${d.key}T12:00:00`).toLocaleDateString("es-GT", { weekday: "short" }),
        level: activityLevelFor(d.count),
      }));
      const peak = Math.max(...days.map((d) => d.count));
      return { ...entry, days, peak };
    })
    .sort((a, b) => b.total - a.total);
}
