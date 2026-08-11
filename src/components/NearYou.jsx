import { useState } from "react";
import { nearestFault } from "../lib/nearestFault";
import { haversineKm } from "../lib/geo";
import { estimateIntensity, intensityLevelFor } from "../lib/intensity";
import { isWithinGuatemala } from "../lib/guatemalaBounds";

const geolocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

export function NearYou({ quake, geologia }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | out-of-area | denied | error
  const [result, setResult] = useState(null);

  function handleActivate() {
    if (!geolocationSupported) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;

        if (!isWithinGuatemala(lat, lon)) {
          setStatus("out-of-area");
          return;
        }

        const fault = nearestFault(lat, lon, geologia);
        const distanceToQuakeKm = quake ? haversineKm(lat, lon, quake.lat, quake.lon) : null;
        const intensity =
          quake && distanceToQuakeKm != null
            ? estimateIntensity(quake.magnitude, quake.depthKm ?? 10, distanceToQuakeKm)
            : null;

        setResult({
          fault,
          distanceToQuakeKm,
          level: intensity != null ? intensityLevelFor(intensity) : null,
        });
        setStatus("ready");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  return (
    <div className="near-you-card">
      <p className="near-you-title">Cerca de ti</p>

      {status === "idle" && (
        <>
          <p className="near-you-text">
            Activa tu ubicación para ver la falla más cercana y qué tan fuerte se pudo haber sentido
            el último sismo en tu punto exacto.
          </p>
          <button onClick={handleActivate}>Activar ubicación</button>
        </>
      )}

      {status === "loading" && <p className="near-you-text">Obteniendo tu ubicación…</p>}

      {status === "denied" && (
        <p className="near-you-text">
          No se pudo acceder a tu ubicación (permiso denegado). Puedes activarlo desde los ajustes
          del navegador e intentar de nuevo.
        </p>
      )}

      {status === "error" && (
        <p className="near-you-text">Tu navegador no soporta geolocalización o hubo un error.</p>
      )}

      {status === "out-of-area" && (
        <p className="near-you-text">
          Tu ubicación está fuera del área de Guatemala que cubre este panel.
        </p>
      )}

      {status === "ready" && result && (
        <dl className="near-you-details">
          {result.fault && (
            <>
              <dt>Falla más cercana</dt>
              <dd>
                {result.fault.name} (~{Math.round(result.fault.distanceKm)} km)
              </dd>
            </>
          )}
          {result.level && (
            <>
              <dt>Intensidad estimada en tu punto</dt>
              <dd style={{ color: result.level.color }}>{result.level.label}</dd>
            </>
          )}
          {result.distanceToQuakeKm != null && (
            <>
              <dt>Distancia al último sismo</dt>
              <dd>{Math.round(result.distanceToQuakeKm)} km</dd>
            </>
          )}
        </dl>
      )}

      <p className="near-you-note">Tu ubicación no se guarda ni se envía a ningún servidor.</p>
    </div>
  );
}
