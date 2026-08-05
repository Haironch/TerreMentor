import { severityFor } from "../lib/severity";
import { SAFETY_TIPS } from "../lib/safetyTips";

export function SafetyTipCard({ quake }) {
  if (!quake) return null;

  const band = severityFor(quake.magnitude);
  const tip = SAFETY_TIPS[band.key];

  return (
    <div className="tip-card" style={{ "--band-color": band.color }}>
      <div className="tip-card-row">
        <p className="tip-card-title">¿Qué hacer? · {band.label}</p>
        <p className="tip-card-text">{tip.tip}</p>
      </div>
      <p className="tip-card-note">
        Consejo general, no oficial · en emergencia sigue las indicaciones de{" "}
        <a href="https://conred.gob.gt" target="_blank" rel="noreferrer">
          CONRED
        </a>
      </p>
    </div>
  );
}
