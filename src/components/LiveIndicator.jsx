export function LiveIndicator({ status = "live" }) {
  const label = status === "live" ? "En vivo" : status === "loading" ? "Conectando" : "Sin conexión";
  return (
    <span className={`live-indicator live-indicator-${status}`}>
      <i />
      {label}
    </span>
  );
}
