import { TileLayer } from "react-leaflet";
import { BASEMAP_ATTRIBUTION, BASEMAP_LABELS_URL, BASEMAP_MAX_NATIVE_ZOOM, BASEMAP_URL } from "../lib/basemap";

export function BaseMapLayers() {
  return (
    <>
      <TileLayer attribution={BASEMAP_ATTRIBUTION} url={BASEMAP_URL} maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM} />
      <TileLayer url={BASEMAP_LABELS_URL} maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM} />
    </>
  );
}
