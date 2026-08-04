import { DEPARTMENTS } from "../../src/lib/departments.js";

const TTL_MS = 20 * 60 * 1000; // el clima cambia mucho menos seguido que los sismos
const cache = new Map();

function buildUrl({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "America/Guatemala",
    forecast_days: "3",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export async function getClima(departamento) {
  const dep = DEPARTMENTS.find((d) => d.name === departamento);
  if (!dep) {
    throw new Error(`Departamento desconocido: ${departamento}`);
  }

  const cached = cache.get(dep.name);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.data;
  }

  const res = await fetch(buildUrl(dep));
  if (!res.ok) {
    throw new Error(`Open-Meteo respondió ${res.status}`);
  }
  const raw = await res.json();

  const data = {
    departamento: dep.name,
    fetchedAt: new Date().toISOString(),
    current: {
      temperatureC: raw.current.temperature_2m,
      humidity: raw.current.relative_humidity_2m,
      precipitationMm: raw.current.precipitation,
      weatherCode: raw.current.weather_code,
      windKmh: raw.current.wind_speed_10m,
    },
    daily: raw.daily.time.map((date, i) => ({
      date,
      weatherCode: raw.daily.weather_code[i],
      tempMaxC: raw.daily.temperature_2m_max[i],
      tempMinC: raw.daily.temperature_2m_min[i],
      precipitationChance: raw.daily.precipitation_probability_max[i],
    })),
  };

  cache.set(dep.name, { data, fetchedAt: Date.now() });
  return data;
}
