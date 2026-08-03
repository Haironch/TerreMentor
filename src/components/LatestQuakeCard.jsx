import { useState } from "react";
import { severityFor } from "../lib/severity";

function formatSummary(quake, stats) {
  return [
    "🌎 Último sismo registrado (INSIVUMEH)",
    `Magnitud: ${quake.magnitude}`,
    `Fecha/hora: ${quake.datetime}`,
    `Profundidad: ${quake.depthKm ?? "?"} km`,
    `Coordenadas: ${quake.lat}, ${quake.lon}`,
    `ID: ${quake.id}`,
    stats?.lastQuakeRelative ? `Hace ${stats.lastQuakeRelative}` : null,
    `Fuente: https://geo.insivumeh.gob.gt/sismo`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function LatestQuakeCard({ quake, stats }) {
  const [copied, setCopied] = useState(false);

  if (!quake) {
    return (
      <div className="latest-card latest-card-empty">
        <p>No hay datos del último sismo todavía.</p>
      </div>
    );
  }

  const band = severityFor(quake.magnitude);
  const summary = formatSummary(quake, stats);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Último sismo en Guatemala", text: summary });
      } catch {
        // el usuario canceló el share, no hacemos nada
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="latest-card" style={{ "--band-color": band.color }}>
      <div className="latest-card-header">
        <div>
          <p className="latest-card-eyebrow">Último sismo registrado</p>
          <div className="latest-card-title">
            <span className="latest-card-hero">{quake.magnitude}</span>
            <span className="latest-card-hero-unit">magnitud</span>
          </div>
          {stats?.lastQuakeRelative && <p className="latest-card-relative">hace {stats.lastQuakeRelative}</p>}
        </div>
        <span className="latest-card-badge">{band.label}</span>
      </div>

      <dl className="latest-card-details">
        <dt>Fecha/hora</dt>
        <dd>{quake.datetime}</dd>
        <dt>Profundidad</dt>
        <dd>{quake.depthKm ?? "?"} km</dd>
        <dt>Coordenadas</dt>
        <dd>
          {quake.lat}, {quake.lon}
        </dd>
        <dt>ID INSIVUMEH</dt>
        <dd>{quake.id}</dd>
      </dl>

      <div className="latest-card-actions">
        <button onClick={handleCopy}>{copied ? "Copiado ✓" : "Copiar datos"}</button>
        <button onClick={handleShare}>Compartir</button>
      </div>
    </div>
  );
}
