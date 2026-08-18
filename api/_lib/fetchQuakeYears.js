const START_YEAR = 2020;
const MIN_MAGNITUDE = 6.5;
const CURRENT_YEAR_TTL_MS = 30 * 60 * 1000;

// Los años ya cerrados no cambian nunca — se cachean para siempre en esta
// instancia. Solo el año en curso (parcial) se revalida seguido.
const cache = new Map();

function tomorrowIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function fetchYearCount(year, isCurrentYear) {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: `${year}-01-01`,
    endtime: isCurrentYear ? tomorrowIso() : `${year + 1}-01-01`,
    minmagnitude: String(MIN_MAGNITUDE),
  });
  const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`USGS respondió ${res.status}`);
  }
  const raw = await res.json();
  return raw.metadata.count;
}

export async function getQuakeYears({ force = false } = {}) {
  const currentYear = new Date().getUTCFullYear();
  const years = [];
  for (let y = START_YEAR; y <= currentYear; y++) years.push(y);

  const results = await Promise.all(
    years.map(async (year) => {
      const isCurrentYear = year === currentYear;
      const cached = cache.get(year);
      const ttl = isCurrentYear ? CURRENT_YEAR_TTL_MS : Infinity;

      if (!force && cached && Date.now() - cached.fetchedAt < ttl) {
        return { year, count: cached.count, partial: isCurrentYear };
      }

      const count = await fetchYearCount(year, isCurrentYear);
      cache.set(year, { count, fetchedAt: Date.now() });
      return { year, count, partial: isCurrentYear };
    })
  );

  return {
    minMagnitude: MIN_MAGNITUDE,
    updatedAt: new Date().toISOString(),
    years: results,
  };
}
