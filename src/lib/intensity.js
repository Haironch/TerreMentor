import { haversineKm } from "./geo";
import { DEPARTMENTS } from "./departments";

// Niveles descriptivos de la escala de Mercalli Modificada (estándar mundial
// para describir qué tan fuerte se SIENTE un sismo — no es lo mismo que la
// magnitud, que mide la energía liberada en el origen).
const INTENSITY_LEVELS = [
  { max: 2, key: "no-perceptible", label: "No perceptible", color: "#6b7480" },
  { max: 4, key: "leve", label: "Leve", color: "#0ca30c" },
  { max: 6, key: "moderado", label: "Moderado", color: "#fab219" },
  { max: 8, key: "fuerte", label: "Fuerte", color: "#ec835a" },
  { max: Infinity, key: "muy-fuerte", label: "Muy fuerte", color: "#d03b3b" },
];

export function intensityLevelFor(value) {
  return INTENSITY_LEVELS.find((l) => value < l.max) ?? INTENSITY_LEVELS[INTENSITY_LEVELS.length - 1];
}

// Fórmula simplificada de atenuación sísmica: la intensidad crece con la
// magnitud y decae con el logaritmo de la distancia hipocentral. Es una
// aproximación educativa de propósito general (no está calibrada con datos
// de intensidad reportada específicos de Guatemala), pensada para dar una
// idea relativa de qué zonas pudieron sentir más el sismo — no un cálculo
// sismológico oficial.
export function estimateIntensity(magnitude, depthKm, epicentralKm) {
  const hypocentralKm = Math.sqrt(epicentralKm ** 2 + depthKm ** 2);
  const r = Math.max(hypocentralKm, 1);
  return 1.7 * magnitude - 3.5 * Math.log10(r) + 2;
}

export function rankDepartmentIntensity(quake) {
  const depthKm = quake.depthKm ?? 10;
  return DEPARTMENTS.map((dep) => {
    const epicentralKm = haversineKm(quake.lat, quake.lon, dep.lat, dep.lon);
    const value = estimateIntensity(quake.magnitude, depthKm, epicentralKm);
    return { name: dep.name, value, level: intensityLevelFor(value), distanceKm: epicentralKm };
  }).sort((a, b) => b.value - a.value);
}
