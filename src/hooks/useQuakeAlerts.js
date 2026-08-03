import { useCallback, useEffect, useRef, useState } from "react";
import { haversineKm } from "../lib/geo";

const SETTINGS_KEY = "terrementor.alerts.settings";
const SEEN_KEY = "terrementor.alerts.seen";
export const DEFAULT_RADIUS_KM = 50;

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage inaccesible o dato corrupto, usamos default
  }
  return { enabled: false, lat: null, lon: null, radiusKm: DEFAULT_RADIUS_KM };
}

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignorar
  }
  return new Set();
}

function saveSeen(seenSet) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seenSet].slice(-200)));
}

const notificationsSupported = typeof window !== "undefined" && "Notification" in window;

export function useQuakeAlerts(sensibleQuakes) {
  const [settings, setSettings] = useState(loadSettings);
  const [permission, setPermission] = useState(notificationsSupported ? Notification.permission : "unsupported");
  const [locationError, setLocationError] = useState(null);
  const quakesRef = useRef(sensibleQuakes);

  useEffect(() => {
    quakesRef.current = sensibleQuakes;
  }, [sensibleQuakes]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const enableAlerts = useCallback((radiusKm) => {
    if (!notificationsSupported || !("geolocation" in navigator)) {
      setLocationError("not-supported");
      return;
    }
    setLocationError(null);

    const afterPermission = (perm) => {
      setPermission(perm);
      if (perm !== "granted") {
        setLocationError("permission-denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Todo lo que ya existe al activar se marca como "visto" para no
          // notificar de golpe sismos que ya estaban en la lista.
          const seen = loadSeen();
          for (const q of quakesRef.current ?? []) seen.add(q.id);
          saveSeen(seen);

          setSettings({
            enabled: true,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            radiusKm: radiusKm ?? DEFAULT_RADIUS_KM,
          });
        },
        (err) => setLocationError(err.code === err.PERMISSION_DENIED ? "location-denied" : "location-error"),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };

    if (Notification.permission === "default") {
      Notification.requestPermission().then(afterPermission);
    } else {
      afterPermission(Notification.permission);
    }
  }, []);

  const disableAlerts = useCallback(() => {
    setSettings((s) => ({ ...s, enabled: false }));
  }, []);

  useEffect(() => {
    if (!settings.enabled || settings.lat == null || permission !== "granted") return;
    if (!sensibleQuakes?.length) return;

    const seen = loadSeen();
    let changed = false;

    for (const q of sensibleQuakes) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      changed = true;

      const distanceKm = haversineKm(settings.lat, settings.lon, q.lat, q.lon);
      if (distanceKm <= settings.radiusKm) {
        try {
          new Notification("Sismo sensible cerca de ti", {
            body: `Magnitud ${q.magnitude} a ~${Math.round(distanceKm)} km · ${q.datetime}`,
            icon: "/pwa-192.png",
            tag: q.id,
          });
        } catch {
          // el navegador puede rechazar Notification() en ciertos contextos
        }
      }
    }

    if (changed) saveSeen(seen);
  }, [sensibleQuakes, settings, permission]);

  return { settings, permission, locationError, enableAlerts, disableAlerts, notificationsSupported };
}
