const GT_OFFSET = "-06:00"; // Guatemala no usa horario de verano

export function parseGtDatetime(datetime) {
  return new Date(`${datetime.replace(" ", "T")}${GT_OFFSET}`).getTime();
}

export function formatGtDatetime(ts) {
  return new Date(ts).toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "short",
    timeStyle: "medium",
  });
}
