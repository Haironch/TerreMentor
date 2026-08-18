import { useState } from "react";
import { DEPARTMENTS } from "../lib/departments";
import { describeWeather } from "../lib/weatherCodes";
import { useWeather } from "../hooks/useWeather";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

function dayLabel(dateStr, index) {
  if (index === 0) return "Hoy";
  const date = new Date(`${dateStr}T00:00:00`);
  const label = date.toLocaleDateString("es-GT", { weekday: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function WeatherDashboard() {
  const [departamento, setDepartamento] = useState("Guatemala");
  const { data, error, loading } = useWeather(departamento);

  const current = data ? describeWeather(data.current.weatherCode) : null;
  const tremble = useTrembleReveal();

  return (
    <section ref={tremble.ref} className={`weather-section ${tremble.className}`}>
      <div className="weather-header">
        <h2>Clima por departamento</h2>
        <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
          {DEPARTMENTS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="skeleton skeleton-card-sm" />}
      {error && <p className="status-msg status-error">No se pudo cargar el clima: {error}</p>}

      {data && (
        <div className="weather-grid">
          <div className="weather-current">
            <div>
              <div className="weather-current-temp">{Math.round(data.current.temperatureC)}°C</div>
              <div className="weather-current-label">{current.label}</div>
            </div>
            <div className="weather-current-extra">
              <span>Humedad: {data.current.humidity}%</span>
              <span>Viento: {Math.round(data.current.windKmh)} km/h</span>
            </div>
          </div>

          <div className="weather-forecast">
            {data.daily.map((day, i) => {
              const desc = describeWeather(day.weatherCode);
              return (
                <div key={day.date} className="weather-forecast-day">
                  <span className="weather-forecast-day-label">{dayLabel(day.date, i)}</span>
                  <span className="weather-forecast-condition">{desc.label}</span>
                  <span className="weather-forecast-temps">
                    <strong>{Math.round(day.tempMaxC)}°</strong> / {Math.round(day.tempMinC)}°
                  </span>
                  <span className="weather-forecast-rain">Prob. lluvia: {day.precipitationChance}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="weather-source">Datos: Open-Meteo · aproximados a la cabecera departamental.</p>
    </section>
  );
}
