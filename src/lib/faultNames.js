// Los 8 trazos de "Principales Fallas" que publica INSIVUMEH no traen nombre
// (properties vacío en el GeoJSON). Identificamos por geografía las 3 fallas
// más documentadas de Guatemala — Motagua, Polochic y Jalpatagua, cuyo trazo
// conocido coincide claramente con estos índices — y para el resto, en vez
// de inventar un nombre que no podemos verificar, usamos un descriptor
// honesto por cercanía a un departamento.
//
// El índice de este arreglo corresponde al orden de
// public/geo/geologia.json -> fallas.features.
export const FAULT_LABELS = [
  "Falla cerca de Alta Verapaz",
  "Falla cerca de Zacapa",
  "Falla de Motagua",
  "Falla cerca de Chiquimula",
  "Falla de Jalpatagua",
  "Falla cerca de Sacatepéquez",
  "Falla cerca de Ciudad de Guatemala",
  "Falla de Polochic",
];

export const TRENCH_LABEL = "Fosa Mesoamericana";
