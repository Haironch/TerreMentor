import { useState } from "react";
import { DEFAULT_RADIUS_KM } from "../hooks/useQuakeAlerts";

const RADIUS_OPTIONS = [25, 50, 100, 200];

const ERROR_MESSAGES = {
  "not-supported": "Tu navegador no soporta notificaciones o ubicación.",
  "permission-denied": "Bloqueaste las notificaciones. Actívalas desde los ajustes del navegador.",
  "location-denied": "Bloqueaste el acceso a tu ubicación. Actívalo desde los ajustes del navegador.",
  "location-error": "No se pudo obtener tu ubicación. Intenta de nuevo.",
};

export function AlertSettings({ alerts }) {
  const [open, setOpen] = useState(false);
  const [radius, setRadius] = useState(alerts.settings.radiusKm ?? DEFAULT_RADIUS_KM);

  const isOn = alerts.settings.enabled && alerts.permission === "granted";

  return (
    <div className="alert-settings">
      <button type="button" className="alert-toggle" onClick={() => setOpen((v) => !v)}>
        Alertas: {isOn ? `${alerts.settings.radiusKm} km` : "Desactivadas"}
      </button>

      {open && (
        <div className="alert-panel">
          <p className="alert-panel-desc">
            Te avisa cuando INSIVUMEH marque un sismo como <strong>sensible</strong> dentro del radio que elijas
            desde tu ubicación. Llega minutos después del sismo, no antes — no es un sistema de alerta temprana.
          </p>

          <label htmlFor="alert-radius">Radio</label>
          <select
            id="alert-radius"
            value={radius}
            disabled={isOn}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>

          {isOn ? (
            <button type="button" onClick={alerts.disableAlerts}>
              Desactivar alertas
            </button>
          ) : (
            <button type="button" onClick={() => alerts.enableAlerts(radius)}>
              Activar alertas
            </button>
          )}

          {alerts.locationError && <p className="alert-panel-error">{ERROR_MESSAGES[alerts.locationError]}</p>}
        </div>
      )}
    </div>
  );
}
