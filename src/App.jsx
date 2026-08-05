import { useState } from "react";
import { useSismos } from "./hooks/useSismos";
import { useQuakeAlerts } from "./hooks/useQuakeAlerts";
import { SismoMap } from "./components/SismoMap";
import { LatestQuakeCard } from "./components/LatestQuakeCard";
import { SafetyTipCard } from "./components/SafetyTipCard";
import { DailyCountChart } from "./components/DailyCountChart";
import { MagnitudeChart } from "./components/MagnitudeChart";
import { RefreshButton } from "./components/RefreshButton";
import { Logo } from "./components/Logo";
import { LiveIndicator } from "./components/LiveIndicator";
import { StatTile } from "./components/StatTile";
import { ZoneRanking } from "./components/ZoneRanking";
import { AlertSettings } from "./components/AlertSettings";
import { WeatherDashboard } from "./components/WeatherDashboard";
import { VolcanoDashboard } from "./components/VolcanoDashboard";
import { LiveSeismograph } from "./components/LiveSeismograph";
import { AppSkeleton } from "./components/Skeleton";
import "./App.css";

function App() {
  const { data, error, loading, refreshing, refetch } = useSismos();
  const [selectedLayer, setSelectedLayer] = useState("SISMOS 1 semana");

  const selectedQuakes = data?.groups?.[selectedLayer]?.quakes ?? [];
  const sensibleQuakes = data?.groups?.["SISMOS 1 semana SENSIBLES"]?.quakes ?? [];
  const alerts = useQuakeAlerts(sensibleQuakes);
  const liveStatus = error ? "offline" : loading ? "loading" : "live";

  return (
    <div className="app">
      <div className="app-glow" aria-hidden="true" />

      <header className="app-header">
        <div className="app-header-top">
          <Logo />
          <div className="header-actions">
            <LiveIndicator status={liveStatus} />
            <AlertSettings alerts={alerts} />
            <RefreshButton refreshing={refreshing} onRefresh={refetch} />
          </div>
        </div>
        <p className="app-subtitle">Proyecto desarrollado por hairch.dev</p>

        {data?.stats && (
          <div className="stat-tiles">
            <StatTile label="Última actualización" value={data.stats.updatedAt} wide />
            <StatTile label="Registrados (semana)" value={data.stats.registrados} />
            <StatTile label="Sensibles (semana)" value={data.stats.sensibles} accent />
            <StatTile label="Total (semana)" value={data.stats.total} />
          </div>
        )}
      </header>

      {error && (
        <p className="status-msg status-error">No se pudo conectar con INSIVUMEH: {error}</p>
      )}

      {loading && <AppSkeleton />}

      {data && <LiveSeismograph quakes={data.groups?.["SISMOS 24 horas"]?.quakes} />}

      {data && (
        <main className="app-grid">
          <SismoMap
            groups={data.groups}
            selectedLayer={selectedLayer}
            onSelectLayer={setSelectedLayer}
            latest={data.latest}
          />

          <aside className="app-sidebar">
            <LatestQuakeCard quake={data.latest} stats={data.stats} />
            <SafetyTipCard quake={data.latest} />
            <ZoneRanking quakes={selectedQuakes} />
            <DailyCountChart quakes={selectedQuakes} />
            <MagnitudeChart quakes={selectedQuakes} />
          </aside>
        </main>
      )}

      <VolcanoDashboard />
      <WeatherDashboard />

      <footer className="app-footer">
        Monitoreo comunitario de sismos en Guatemala y Centroamérica, con datos públicos de{" "}
        <a href="https://geo.insivumeh.gob.gt/sismo" target="_blank" rel="noreferrer">
          INSIVUMEH
        </a>{" "}
        · Proyecto comunitario sin fines de lucro.
      </footer>
    </div>
  );
}

export default App;
