import { useVolcanoStatus } from "../hooks/useVolcanoStatus";
import { VolcanoCams } from "./VolcanoCams";
import { VolcanoBulletins } from "./VolcanoBulletins";
import { useTrembleReveal } from "../hooks/useTrembleReveal";

export function VolcanoDashboard() {
  const { data, error, loading } = useVolcanoStatus();
  const tremble = useTrembleReveal();

  return (
    <section ref={tremble.ref} className={`volcano-section ${tremble.className}`}>
      <div className="volcano-header">
        <h2>Volcanes</h2>
        <p className="volcano-subtitle">Cámaras en vivo y boletines de INSIVUMEH</p>
      </div>

      {loading && <div className="skeleton skeleton-card-sm" />}
      {error && <p className="status-msg status-error">No se pudo cargar el estado volcánico: {error}</p>}

      <VolcanoCams />

      {data && <VolcanoBulletins data={data} />}

      <p className="volcano-source">
        Fuente:{" "}
        <a href="https://insivumeh.gob.gt/vulcanologia-boletines-diarios-1/" target="_blank" rel="noreferrer">
          INSIVUMEH
        </a>{" "}
        · los boletines especiales solo aparecen durante fases eruptivas.
      </p>
    </section>
  );
}
