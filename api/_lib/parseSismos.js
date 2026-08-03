// Parsea el HTML generado por Folium/Leaflet que INSIVUMEH publica en
// https://geo.insivumeh.gob.gt/sismo. No es una API JSON: los datos de cada
// sismo vienen incrustados como código JS (L.circleMarker/L.marker + popups
// y tooltips) dentro de un único archivo HTML estático de varios MB.

const FIELD_PATTERNS = {
  id: /ID:\s*<\/b>\s*([a-zA-Z0-9]+)/,
  nst: /NST:\s*<\/b>\s*(\d+)/,
  rms: /RMS:\s*<\/b>\s*([\d.]+)/,
  gap: /GAP:\s*<\/b>\s*([\d.]+)/,
  magnitude: /Magnitud:\s*<\/b>\s*([\d.]+)/,
  datetime: /Tiempo de Origen:\s*<\/b>\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
  depthKm: /Profundidad:\s*<\/b>\s*([\d.]+)\s*km/,
  analyst: /Analista:\s*<\/b>\s*([^\n<]+)/,
  color: /"(?:fillC|c)olor":\s*"(#[0-9A-Fa-f]{6})"/,
};

const MARKER_START_RE = /L\.(?:circleMarker|marker)\(\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g;
const GROUP_DECL_RE = /var\s+(feature_group_[a-f0-9]+)\s*=\s*L\.featureGroup\(/g;
const LAYER_LABEL_RE = /"([^"]+)"\s*:\s*(feature_group_[a-f0-9]+)/g;
const HIDDEN_GROUP_RE = /(feature_group_[a-f0-9]+)\.remove\(\)/g;

function extractField(text, key) {
  const match = FIELD_PATTERNS[key].exec(text);
  return match ? match[1].trim() : null;
}

function parseQuakeBlock(block, lat, lon) {
  const magnitude = extractField(block, "magnitude");
  const datetime = extractField(block, "datetime");
  const depthKm = extractField(block, "depthKm");
  const id = extractField(block, "id");
  if (!magnitude || !datetime || !id) return null;

  return {
    id,
    magnitude: Number(magnitude),
    datetime,
    depthKm: depthKm ? Number(depthKm) : null,
    lat: Number(lat),
    lon: Number(lon),
    nst: extractField(block, "nst") ? Number(extractField(block, "nst")) : null,
    rms: extractField(block, "rms") ? Number(extractField(block, "rms")) : null,
    gap: extractField(block, "gap") ? Number(extractField(block, "gap")) : null,
    analyst: extractField(block, "analyst"),
    color: extractField(block, "color"),
  };
}

function parseQuakesFromChunk(chunk) {
  const starts = [];
  let m;
  MARKER_START_RE.lastIndex = 0;
  while ((m = MARKER_START_RE.exec(chunk)) !== null) {
    starts.push({ index: m.index, lat: m[1], lon: m[2] });
  }

  const quakes = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].index : chunk.length;
    const block = chunk.slice(start.index, end);
    const quake = parseQuakeBlock(block, start.lat, start.lon);
    if (quake) quakes.push(quake);
  }
  return quakes;
}

function parseLayerLabels(html) {
  const layerControlStart = html.indexOf("overlays :");
  if (layerControlStart === -1) return new Map();
  const slice = html.slice(layerControlStart, layerControlStart + 4000);

  const labels = new Map();
  let m;
  LAYER_LABEL_RE.lastIndex = 0;
  while ((m = LAYER_LABEL_RE.exec(slice)) !== null) {
    labels.set(m[2], m[1]);
  }
  return labels;
}

function parseHiddenGroups(html) {
  const hidden = new Set();
  let m;
  HIDDEN_GROUP_RE.lastIndex = 0;
  while ((m = HIDDEN_GROUP_RE.exec(html)) !== null) {
    hidden.add(m[1]);
  }
  return hidden;
}

function parseStats(html) {
  const updated = /Actualizado\s+([\d\-: ]+?)\s*</.exec(html);
  const registrados = /SISMOS REGISTRADOS:\s*(\d+)/.exec(html);
  const sensibles = /SISMOS SENSIBLES:\s*(\d+)/.exec(html);
  const total = /TOTAL DE SISMOS:\s*(\d+)/.exec(html);
  const ultimo = /ULTIMO SISMO:<br>\s*([\d\-: ]+?)\s*\(([^)]+)\)/.exec(html);

  return {
    updatedAt: updated ? updated[1].trim() : null,
    registrados: registrados ? Number(registrados[1]) : null,
    sensibles: sensibles ? Number(sensibles[1]) : null,
    total: total ? Number(total[1]) : null,
    lastQuakeAt: ultimo ? ultimo[1].trim() : null,
    lastQuakeRelative: ultimo ? ultimo[2].trim() : null,
  };
}

export function parseSismosHtml(html) {
  const stats = parseStats(html);
  const layerLabels = parseLayerLabels(html);
  const hiddenGroups = parseHiddenGroups(html);

  const groupStarts = [];
  let m;
  GROUP_DECL_RE.lastIndex = 0;
  while ((m = GROUP_DECL_RE.exec(html)) !== null) {
    groupStarts.push({ index: m.index, varName: m[1] });
  }

  const groups = {};
  for (let i = 0; i < groupStarts.length; i++) {
    const { index, varName } = groupStarts[i];
    const end = i + 1 < groupStarts.length ? groupStarts[i + 1].index : html.length;
    const chunk = html.slice(index, end);
    const label = layerLabels.get(varName) || varName;

    groups[label] = {
      visibleByDefault: !hiddenGroups.has(varName),
      quakes: parseQuakesFromChunk(chunk),
    };
  }

  const latest = groups["ULTIMO SISMOS"]?.quakes[0] || null;

  return {
    source: "https://geo.insivumeh.gob.gt/sismo",
    fetchedAt: new Date().toISOString(),
    stats,
    latest,
    groups,
  };
}
