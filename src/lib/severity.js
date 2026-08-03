// Bandas de severidad por magnitud, usando la paleta de estado (fija, no se
// tematiza) para que el color tenga siempre el mismo significado en el mapa
// y en las gráficas.
export const SEVERITY_BANDS = [
  { key: "leve", label: "Leve (< 3.0)", max: 3.0, color: "#0ca30c" },
  { key: "moderado", label: "Moderado (3.0–3.9)", max: 4.0, color: "#fab219" },
  { key: "fuerte", label: "Fuerte (4.0–4.9)", max: 5.0, color: "#ec835a" },
  { key: "severo", label: "Severo (≥ 5.0)", max: Infinity, color: "#d03b3b" },
];

export function severityFor(magnitude) {
  return SEVERITY_BANDS.find((band) => magnitude < band.max) ?? SEVERITY_BANDS[SEVERITY_BANDS.length - 1];
}
