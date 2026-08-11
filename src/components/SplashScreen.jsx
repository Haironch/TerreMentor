import { useEffect, useState } from "react";

const WAVE_D = "M0 60 L70 60 L88 34 L106 86 L124 12 L142 92 L160 44 L178 68 L196 50 L400 60";
const MIN_VISIBLE_MS = 1000;
const LEAVE_MS = 500;

const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SplashScreen({ ready }) {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ready) return undefined;

    const holdTimer = setTimeout(() => setLeaving(true), MIN_VISIBLE_MS);
    return () => clearTimeout(holdTimer);
  }, [ready]);

  useEffect(() => {
    if (!leaving) return undefined;
    const removeTimer = setTimeout(() => setMounted(false), LEAVE_MS);
    return () => clearTimeout(removeTimer);
  }, [leaving]);

  if (!mounted) return null;

  return (
    <div className={`splash${leaving ? " splash-leaving" : ""}`} aria-hidden="true">
      <svg className="splash-wave" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
        <path className="splash-wave-path" d={WAVE_D} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {!reducedMotion && (
          <circle className="splash-wave-dot" r="3.5">
            <animateMotion dur="2.6s" repeatCount="indefinite" path={WAVE_D} />
          </circle>
        )}
      </svg>
      <p className="splash-label">Bienvenido</p>
    </div>
  );
}
