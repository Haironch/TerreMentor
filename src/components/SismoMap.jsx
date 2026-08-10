import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import { severityFor, SEVERITY_BANDS } from "../lib/severity";
import { HeatmapLayer } from "./HeatmapLayer";
import { MapAutoResize } from "./MapAutoResize";
import { TimelapseControls } from "./TimelapseControls";
import { FaultLinesLayer, FAULT_COLOR, TRENCH_COLOR } from "./FaultLinesLayer";
import { useTimelapse } from "../hooks/useTimelapse";
import { nearestFault } from "../lib/nearestFault";

const GUATEMALA_CENTER = [14.6, -90.6];

const LAYER_OPTIONS = [
  { key: "SISMOS 24 horas", label: "Últimas 24 horas" },
  { key: "SISMOS 1 semana", label: "Última semana" },
  { key: "SISMOS 1 semana SENSIBLES", label: "Última semana · sensibles" },
  { key: "SISMOS 1 mes", label: "Último mes" },
  { key: "SISMOS 1 mes SENSIBLES", label: "Último mes · sensibles" },
];

const VIEW_MODES = [
  { key: "points", label: "Puntos" },
  { key: "heat", label: "Calor" },
];

function radiusFor(magnitude) {
  return Math.max(4, magnitude * 2.6);
}

const pulseIcon = L.divIcon({
  className: "quake-pulse-icon-wrapper",
  html: renderToStaticMarkup(
    <div className="quake-pulse-icon">
      <span className="ring" />
      <span className="dot" />
    </div>
  ),
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function QuakePopup({ q, band }) {
  return (
    <Popup>
      <strong>Magnitud {q.magnitude}</strong> · {band.label}
      <br />
      {q.datetime}
      <br />
      Profundidad: {q.depthKm ?? "?"} km
      {q.fault && (
        <>
          <br />
          {q.fault.name} (~{Math.round(q.fault.distanceKm)} km)
        </>
      )}
      <br />
      <a href={`https://geo.insivumeh.gob.gt/IMM/HISTORICO/${q.id}`} target="_blank" rel="noreferrer">
        Ver ficha en INSIVUMEH
      </a>
    </Popup>
  );
}

export function SismoMap({ groups, selectedLayer, onSelectLayer, latest, geologia }) {
  const [viewMode, setViewMode] = useState("points");
  const [showFaults, setShowFaults] = useState(true);
  const rawQuakes = useMemo(() => groups?.[selectedLayer]?.quakes ?? [], [groups, selectedLayer]);
  const quakes = useMemo(
    () => rawQuakes.map((q) => ({ ...q, fault: nearestFault(q.lat, q.lon, geologia) })),
    [rawQuakes, geologia]
  );
  const latestWithFault = useMemo(
    () => (latest ? { ...latest, fault: nearestFault(latest.lat, latest.lon, geologia) } : null),
    [latest, geologia]
  );
  const timelapse = useTimelapse(quakes);
  const heatPoints = useMemo(
    () => timelapse.displayQuakes.map((q) => [q.lat, q.lon, q.magnitude]),
    [timelapse.displayQuakes]
  );

  return (
    <div className="sismo-map">
      <div className="sismo-map-toolbar">
        <label htmlFor="layer-select">Rango:</label>
        <select id="layer-select" value={selectedLayer} onChange={(e) => onSelectLayer(e.target.value)}>
          {LAYER_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key} disabled={!groups?.[opt.key]?.quakes.length}>
              {opt.label} ({groups?.[opt.key]?.quakes.length ?? 0})
            </option>
          ))}
        </select>

        <div className="view-mode-toggle">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={mode.key === viewMode ? "active" : ""}
              onClick={() => setViewMode(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`fault-toggle ${showFaults ? "active" : ""}`}
          onClick={() => setShowFaults((v) => !v)}
        >
          Fallas y placas
        </button>

        {viewMode === "points" ? (
          <div className="sismo-legend">
            {SEVERITY_BANDS.map((band) => (
              <span key={band.key} className="sismo-legend-item">
                <i style={{ background: band.color }} />
                {band.label}
              </span>
            ))}
            {showFaults && (
              <>
                <span className="sismo-legend-item">
                  <i style={{ background: FAULT_COLOR }} />
                  Fallas principales
                </span>
                <span className="sismo-legend-item">
                  <i style={{ background: TRENCH_COLOR }} />
                  Fosa Mesoamericana
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="sismo-legend">
            <span className="heat-legend-gradient" />
            <span className="heat-legend-label">Baja</span>
            <span className="heat-legend-label">Alta densidad</span>
          </div>
        )}
      </div>

      <TimelapseControls
        disabled={!timelapse.canPlay}
        isPlaying={timelapse.isPlaying}
        progress={timelapse.progress}
        label={timelapse.label}
        onTogglePlay={timelapse.togglePlay}
        onScrub={timelapse.scrub}
      />

      <MapContainer center={GUATEMALA_CENTER} zoom={7} scrollWheelZoom={false} className="sismo-map-canvas">
        <MapAutoResize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {showFaults && <FaultLinesLayer geologia={geologia} />}

        {viewMode === "points" &&
          timelapse.displayQuakes.map((q) => {
            const band = severityFor(q.magnitude);
            return (
              <CircleMarker
                key={q.id}
                center={[q.lat, q.lon]}
                radius={radiusFor(q.magnitude)}
                pathOptions={{ color: band.color, fillColor: band.color, fillOpacity: 0.75, weight: 1 }}
              >
                <QuakePopup q={q} band={band} />
              </CircleMarker>
            );
          })}

        {viewMode === "heat" && <HeatmapLayer points={heatPoints} />}

        {latestWithFault && (
          <Marker position={[latestWithFault.lat, latestWithFault.lon]} icon={pulseIcon}>
            <QuakePopup q={latestWithFault} band={severityFor(latestWithFault.magnitude)} />
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
