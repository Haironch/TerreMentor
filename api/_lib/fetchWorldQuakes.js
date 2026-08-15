const TTL_MS = 30 * 60 * 1000;
const TOP_N = 10;
// 6.5+ son los que de verdad son mundialmente grandes — a partir de ahí un
// sismo empieza a ser noticia internacional independientemente de dónde
// ocurra. Umbrales más bajos meten de más sismos regionales de EE. UU. que
// el índice de "significancia" del USGS infla por volumen de reportes "lo
// sentí", no porque sean grandes a nivel mundial.
const MIN_MAGNITUDE = 6.5;

let cache = null;
let fetchedAt = 0;

function yearStart() {
  const now = new Date();
  return `${now.getUTCFullYear()}-01-01`;
}

function tomorrowIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getWorldQuakes({ force = false } = {}) {
  if (!force && cache && Date.now() - fetchedAt < TTL_MS) {
    return cache;
  }

  const params = new URLSearchParams({
    format: "geojson",
    starttime: yearStart(),
    endtime: tomorrowIso(),
    minmagnitude: String(MIN_MAGNITUDE),
    orderby: "magnitude",
  });
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USGS respondió ${res.status}`);
  }
  const raw = await res.json();

  // orderby=magnitude del USGS es descendente — tomamos los N más grandes
  // y los dejamos de menor a mayor para la lista.
  const top = raw.features.slice(0, TOP_N).reverse();

  const quakes = top.map((f) => ({
    id: f.id,
    magnitude: Math.round(f.properties.mag * 10) / 10,
    place: f.properties.place,
    time: new Date(f.properties.time).toISOString(),
    significance: f.properties.sig,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    depthKm: Math.round(f.geometry.coordinates[2] * 10) / 10,
    url: f.properties.url,
  }));

  const data = {
    year: new Date().getUTCFullYear(),
    updatedAt: new Date().toISOString(),
    source: "USGS Earthquake Catalog (fdsnws/event)",
    minMagnitude: MIN_MAGNITUDE,
    quakes,
  };

  cache = data;
  fetchedAt = Date.now();
  return data;
}
