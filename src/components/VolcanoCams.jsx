import { useEffect, useState } from "react";

const REFRESH_MS = 10_000;

const CAMERAS = [
  { code: "fg8", label: "Fuego · Cámara 1" },
  { code: "fg12", label: "Fuego · Cámara 2" },
  { code: "fg14", label: "Fuego · Cámara 3" },
  { code: "stpj", label: "Santiaguito" },
];

function useTick(intervalMs) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}

export function VolcanoCams() {
  const tick = useTick(REFRESH_MS);
  const [errored, setErrored] = useState(() => new Set());

  function markError(code, hasError) {
    setErrored((prev) => {
      const next = new Set(prev);
      if (hasError) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  return (
    <div className="volcano-cams">
      {CAMERAS.map((cam) => (
        <div key={cam.code} className="volcano-cam-card">
          <div className="volcano-cam-header">
            <span>{cam.label}</span>
            <span className="volcano-cam-live">● EN VIVO</span>
          </div>
          <div className="volcano-cam-media">
            <img
              src={`https://geo.insivumeh.gob.gt/${cam.code}?t=${tick}`}
              alt={`Cámara en vivo ${cam.label}`}
              loading="lazy"
              onError={() => markError(cam.code, true)}
              onLoad={() => markError(cam.code, false)}
            />
            {errored.has(cam.code) && (
              <div className="volcano-cam-offline">Cámara no disponible, reintentando…</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
