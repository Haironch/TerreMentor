// Códigos de clima WMO (los mismos que usa Open-Meteo) traducidos a texto y
// emoji en español. https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES = {
  0: { label: "Despejado", emoji: "☀️" },
  1: { label: "Mayormente despejado", emoji: "🌤️" },
  2: { label: "Parcialmente nublado", emoji: "⛅" },
  3: { label: "Nublado", emoji: "☁️" },
  45: { label: "Neblina", emoji: "🌫️" },
  48: { label: "Neblina", emoji: "🌫️" },
  51: { label: "Llovizna ligera", emoji: "🌦️" },
  53: { label: "Llovizna", emoji: "🌦️" },
  55: { label: "Llovizna intensa", emoji: "🌧️" },
  56: { label: "Llovizna helada", emoji: "🌧️" },
  57: { label: "Llovizna helada", emoji: "🌧️" },
  61: { label: "Lluvia ligera", emoji: "🌧️" },
  63: { label: "Lluvia", emoji: "🌧️" },
  65: { label: "Lluvia intensa", emoji: "🌧️" },
  66: { label: "Lluvia helada", emoji: "🌧️" },
  67: { label: "Lluvia helada intensa", emoji: "🌧️" },
  71: { label: "Nieve ligera", emoji: "❄️" },
  73: { label: "Nieve", emoji: "❄️" },
  75: { label: "Nieve intensa", emoji: "❄️" },
  77: { label: "Granizo", emoji: "❄️" },
  80: { label: "Chubascos ligeros", emoji: "🌦️" },
  81: { label: "Chubascos", emoji: "🌧️" },
  82: { label: "Chubascos fuertes", emoji: "⛈️" },
  85: { label: "Chubascos de nieve", emoji: "🌨️" },
  86: { label: "Chubascos de nieve fuertes", emoji: "🌨️" },
  95: { label: "Tormenta eléctrica", emoji: "⛈️" },
  96: { label: "Tormenta con granizo", emoji: "⛈️" },
  99: { label: "Tormenta con granizo fuerte", emoji: "⛈️" },
};

export function describeWeather(code) {
  return WEATHER_CODES[code] ?? { label: "Sin datos", emoji: "❓" };
}
