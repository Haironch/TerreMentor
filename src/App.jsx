import { useState } from "react";
import { useSismos } from "./hooks/useSismos";
import { SismoMap } from "./components/SismoMap";
import { LatestQuakeCard } from "./components/LatestQuakeCard";
import { DailyCountChart } from "./components/DailyCountChart";
import { MagnitudeChart } from "./components/MagnitudeChart";
import { RefreshButton } from "./components/RefreshButton";
import { Logo } from "./components/Logo";
import { LiveIndicator } from "./components/LiveIndicator";
import { StatTile } from "./components/StatTile";
import { AppSkeleton } from "./components/Skeleton";
import "./App.css";

function App() {
  const { data, error, loading, refreshing, refetch } = useSismos();
  const [selectedLayer, setSelectedLayer] = useState("SISMOS 1 semana");

  const selectedQuakes = data?.groups?.[selectedLayer]?.quakes ?? [];
  const liveStatus = error ? "offline" : loading ? "loading" : "live";

  return (
    <div className="app">
      <div className="app-glow" aria-hidden="true" />

      <header className="app-header">
        <div className="app-header-top">
          <Logo />
          <div className="header-actions">
            <LiveIndicator status={liveStatus} />
            <RefreshButton refreshing={refreshing} onRefresh={refetch} />
          </div>
        </div>
        <p className="app-subtitle">
          Monitoreo comunitario de sismos en Guatemala y Centroamérica, con datos públicos de INSIVUMEH.
        </p>

        {data?.stats && (
          <div className="stat-tiles">
            <StatTile label="Última actualización" value={data.stats.updatedAt} />
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
            <DailyCountChart quakes={selectedQuakes} />
            <MagnitudeChart quakes={selectedQuakes} />
          </aside>
        </main>
      )}

      <footer className="app-footer">
        Datos: <a href="https://geo.insivumeh.gob.gt/sismo" target="_blank" rel="noreferrer">INSIVUMEH</a> · Proyecto
        comunitario sin fines de lucro.
      </footer>
    </div>
  );
}

export default App;
