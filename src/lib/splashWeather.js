// Decide qué animación de clima mostrar en la pantalla de inicio.
// Siempre devuelve una de las tres escenas: "lluvia", "calor" o "frio".

// Ajusta estos valores si quieres que cambie el criterio.
const HOT_FROM_C = 22; // temperatura actual desde la que se considera "calor"
const RAIN_CHANCE_TODAY = 50; // % de probabilidad de lluvia del día para mostrar lluvia

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

export const SPLASH_WEATHER_KINDS = ["lluvia", "calor", "frio"];

export function pickSplashWeather(clima) {
  const current = clima?.current;
  if (!current || typeof current.temperatureC !== "number") return null;

  const today = clima.daily?.[0];
  const rainingNow = current.precipitationMm > 0 || RAIN_CODES.has(current.weatherCode);
  const rainLikelyToday =
    today && RAIN_CODES.has(today.weatherCode) && (today.precipitationChance ?? 0) >= RAIN_CHANCE_TODAY;

  if (rainingNow || rainLikelyToday) return "lluvia";
  return current.temperatureC >= HOT_FROM_C ? "calor" : "frio";
}

const LABELS = {
  lluvia: "Hoy hay lluvia",
  calor: "Hoy hace calor",
  frio: "Hoy hace frío",
};

export function splashWeatherLabel(kind, clima) {
  const temp = clima?.current?.temperatureC;
  const place = clima?.departamento;
  const parts = [LABELS[kind]];
  if (typeof temp === "number") parts.push(`${Math.round(temp)} °C${place ? ` en ${place}` : ""}`);
  return parts.join(" · ");
}

// Permite forzar una escena para probarla: ?clima=lluvia | calor | frio
export function forcedSplashWeather() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("clima");
  return SPLASH_WEATHER_KINDS.includes(value) ? value : null;
}
