// Mapa base oscuro de Esri (no requiere API key). Son dos capas: el fondo
// sin texto y, encima, las etiquetas con nombres de lugares (PNG transparente).
// Ojo: Esri usa el orden {z}/{y}/{x}, no {z}/{x}/{y}.
const ESRI_BASE = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";

export const BASEMAP_URL = `${ESRI_BASE}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
export const BASEMAP_LABELS_URL = `${ESRI_BASE}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`;
export const BASEMAP_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";
export const BASEMAP_MAX_NATIVE_ZOOM = 16;

export function basemapTileUrl(template, z, x, y) {
  return template.replace("{z}", z).replace("{y}", y).replace("{x}", x);
}
