export function VolcanoBulletins({ data }) {
  return (
    <div className="volcano-bulletins">
      <div className="volcano-status-row">
        {data.volcanes.map((v) => (
          <div key={v.nombre} className={`volcano-status-badge ${v.activo ? "is-active" : ""}`}>
            <span className="volcano-status-dot" />
            <div>
              <div className="volcano-status-name">{v.nombre}</div>
              <div className="volcano-status-text">
                {v.activo ? "Boletín especial activo" : "Actividad rutinaria"}
              </div>
            </div>
            {v.activo && v.boletinUrl && (
              <a href={v.boletinUrl} target="_blank" rel="noreferrer" className="volcano-status-link">
                Ver PDF
              </a>
            )}
          </div>
        ))}
      </div>

      {data.boletinDiario && (
        <a href={data.boletinDiario.url} target="_blank" rel="noreferrer" className="volcano-daily-link">
          Boletín diario (Fuego · Santiaguito · Pacaya) — {data.boletinDiario.fecha}
        </a>
      )}
    </div>
  );
}
