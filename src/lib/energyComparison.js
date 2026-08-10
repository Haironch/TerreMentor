// Escala de Gutenberg-Richter: la energía liberada crece ~10^1.5 por cada
// punto de magnitud. Esto permite comparar sismos de forma más intuitiva
// que solo mirando el número de magnitud (que es logarítmico).
export function energyRatio(magnitudeA, magnitudeB) {
  return Math.pow(10, 1.5 * (magnitudeA - magnitudeB));
}

export function formatEnergyRatio(ratio) {
  if (ratio >= 1000) return Math.round(ratio).toLocaleString("es-GT");
  if (ratio >= 10) return Math.round(ratio).toString();
  return ratio.toFixed(1);
}

export function describeEnergyComparison(historicMagnitude, currentMagnitude) {
  const ratio = energyRatio(historicMagnitude, currentMagnitude);
  if (ratio >= 1) {
    return `liberó ~${formatEnergyRatio(ratio)}× más energía`;
  }
  return `liberó ~${formatEnergyRatio(1 / ratio)}× menos energía`;
}
