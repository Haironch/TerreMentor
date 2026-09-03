import { useState } from "react";
import { useSismos } from "./hooks/useSismos";
import { useQuakeAlerts } from "./hooks/useQuakeAlerts";
import { useGeologia } from "./hooks/useGeologia";
import { SismoMap } from "./components/SismoMap";
import { LatestQuakeCard } from "./components/LatestQuakeCard";
import { SafetyTipCard } from "./components/SafetyTipCard";
import { NearYou } from "./components/NearYou";
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
import { WorldQuakesDashboard } from "./components/WorldQuakesDashboard";
import { LiveSeismograph } from "./components/LiveSeismograph";
import { IntensityDashboard } from "./components/IntensityDashboard";
import { HistoricalComparison } from "./components/HistoricalComparison";
import { AftershockSequence } from "./components/AftershockSequence";
import { FaultActivityGauges } from "./components/FaultActivityGauges";
import { AppSkeleton } from "./components/Skeleton";
import { SplashScreen } from "./components/SplashScreen";
import "./App.css";

function App() {
  const { data, error, loading, refreshing, refetch } = useSismos();
  const geologia = useGeologia();
  const [selectedLayer, setSelectedLayer] = useState("SISMOS 1 semana");

  const selectedQuakes = data?.groups?.[selectedLayer]?.quakes ?? [];
  const sensibleQuakes = data?.groups?.["SISMOS 1 semana SENSIBLES"]?.quakes ?? [];
  const alerts = useQuakeAlerts(sensibleQuakes);
  const liveStatus = error ? "offline" : loading ? "loading" : "live";

  return (
    <div className="app">
      <SplashScreen ready={!loading} />
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
            geologia={geologia}
          />

          <aside className="app-sidebar">
            <LatestQuakeCard quake={data.latest} stats={data.stats} geologia={geologia} />
            <SafetyTipCard quake={data.latest} />
            <NearYou quake={data.latest} geologia={geologia} />
            <ZoneRanking quakes={selectedQuakes} />
            <DailyCountChart quakes={selectedQuakes} />
            <MagnitudeChart quakes={selectedQuakes} />
          </aside>

          {data?.latest && <IntensityDashboard quake={data.latest} />}
          {data?.latest && <HistoricalComparison quake={data.latest} />}
        </main>
      )}

      <AftershockSequence quakes={data?.groups?.["SISMOS 1 mes"]?.quakes} />
      <FaultActivityGauges quakes={data?.groups?.["SISMOS 1 semana"]?.quakes} geologia={geologia} />

      <VolcanoDashboard />
      <WeatherDashboard />
      <WorldQuakesDashboard />

      <footer className="app-footer">
        <p className="app-footer-sources">
          Datos públicos de{" "}
          <a href="https://geo.insivumeh.gob.gt/sismo" target="_blank" rel="noreferrer">
            INSIVUMEH
          </a>
          ,{" "}
          <a href="https://www.usgs.gov/programs/earthquake-hazards" target="_blank" rel="noreferrer">
            USGS
          </a>
          ,{" "}
          <a href="https://conred.gob.gt" target="_blank" rel="noreferrer">
            CONRED
          </a>{" "}
          y{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          .
        </p>
        <p className="app-footer-disclaimer">
          TerreMentor no es una aplicación oficial de ningún gobierno ni institución — es un
          proyecto comunitario, independiente y sin fines de lucro.
        </p>
        <p>
          <a href="/privacidad.html">Política de privacidad</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
