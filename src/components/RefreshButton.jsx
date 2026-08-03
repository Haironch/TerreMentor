import { useEffect, useRef, useState } from "react";

const COOLDOWN_S = 15;

export function RefreshButton({ refreshing, onRefresh }) {
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function handleClick() {
    if (refreshing || cooldown > 0) return;
    onRefresh();
    setCooldown(COOLDOWN_S);
    intervalRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  const disabled = refreshing || cooldown > 0;
  const label = refreshing ? "Actualizando…" : cooldown > 0 ? `Espera ${cooldown}s` : "Actualizar ahora";

  return (
    <button className="refresh-button" onClick={handleClick} disabled={disabled}>
      {label}
    </button>
  );
}
