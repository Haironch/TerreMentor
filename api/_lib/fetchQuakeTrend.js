const START_YEAR = 2020;
const MIN_MAGNITUDE = 6.5;
const WINDOW_DAYS = 90;
const TTL_MS = 6 * 60 * 60 * 1000;

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

let cache = null;
let fetchedAt = 0;

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

async function countInRange(start, end) {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: toIso(start),
    endtime: toIso(end),
    minmagnitude: String(MIN_MAGNITUDE),
  });
  const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`USGS respondió ${res.status}`);
  }
  const raw = await res.json();
  return raw.metadata.count;
}

export async function getQuakeTrend({ force = false } = {}) {
  if (!force && cache && Date.now() - fetchedAt < TTL_MS) {
    return cache;
  }

  const now = new Date();
  const windowEnd = addDays(now, 1); // margen de un día, igual que el resto de la app
  const windowStart = addDays(now, -WINDOW_DAYS);

  // Mismo rango de días-del-año, pero recorrido en cada año desde 2020.
  const currentYear = now.getUTCFullYear();
  const yearOffsets = [];
  for (let y = START_YEAR; y <= currentYear; y++) yearOffsets.push(currentYear - y);

  const recentWindowYears = await Promise.all(
    yearOffsets.map(async (offset) => {
      const year = currentYear - offset;
      const start = addDays(windowStart, -offset * 365);
      const end = addDays(windowEnd, -offset * 365);
      const count = await countInRange(start, end);
      return { year, count };
    })
  );

  const currentMonth = now.getUTCMonth(); // 0-indexed
  const monthly = [];
  for (let m = 0; m <= currentMonth; m++) {
    const start = new Date(Date.UTC(currentYear, m, 1));
    const end = m === currentMonth ? windowEnd : new Date(Date.UTC(currentYear, m + 1, 1));
    const count = await countInRange(start, end);
    monthly.push({ month: m + 1, label: MONTH_LABELS[m], count, partial: m === currentMonth });
  }

  const data = {
    minMagnitude: MIN_MAGNITUDE,
    windowDays: WINDOW_DAYS,
    updatedAt: now.toISOString(),
    recentWindow: { years: recentWindowYears },
    monthly,
  };

  cache = data;
  fetchedAt = Date.now();
  return data;
}
