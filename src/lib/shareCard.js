import { severityFor } from "./severity";
import { nearestZone } from "./zones";
import { nearestFault } from "./nearestFault";
import { HISTORICAL_QUAKES } from "./historicalQuakes";
import { describeEnergyComparison } from "./energyComparison";

const WIDTH = 1080;
const HEIGHT = 1350;

const COLORS = {
  page: "#0a0d12",
  surface: "#12161d",
  border: "rgba(255,255,255,0.15)",
  textPrimary: "#f2f4f7",
  textSecondary: "#9aa4b2",
  textMuted: "#6b7480",
  accent: "#3987e5",
};

const LOGO_PATH = [
  [4, 21],
  [10, 21],
  [13, 15],
  [16, 27],
  [19, 9],
  [22, 31],
  [25, 17],
  [28, 23],
  [31, 19],
  [36, 21],
];

// Onda decorativa de sismógrafo — mismo lenguaje visual que el logo y el
// splash de bienvenida, usada como fondo sutil (no lleva datos).
const DECOR_WAVE = [
  [0, 40],
  [140, 40],
  [175, 8],
  [210, 72],
  [245, 0],
  [280, 80],
  [315, 30],
  [350, 50],
  [385, 36],
  [1080, 40],
];

async function ensureFonts() {
  const specs = [
    '700 44px "Space Grotesk"',
    '700 220px "Space Grotesk"',
    '600 30px "Inter"',
    '600 32px "Inter"',
    '600 24px "Inter"',
    '600 38px "Inter"',
    '600 22px "Inter"',
    '500 40px "Inter"',
    '400 32px "Inter"',
    '400 28px "Inter"',
    '500 34px "JetBrains Mono"',
  ];
  await Promise.all(specs.map((s) => document.fonts.load(s)));
  await document.fonts.ready;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLogo(ctx, x, y, size) {
  const scale = size / 40;
  roundRect(ctx, x, y, size, size, size * 0.28);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3 * scale;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  LOGO_PATH.forEach(([px, py], i) => {
    const cx = x + px * scale;
    const cy = y + py * scale;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
}

function drawDecorWave(ctx, x, y, width, height, color, opacity) {
  const scaleX = width / 1080;
  const scaleY = height / 80;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  DECOR_WAVE.forEach(([px, py], i) => {
    const cx = x + px * scaleX;
    const cy = y + py * scaleY;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
  ctx.restore();
}

async function loadGuatemalaOutline() {
  try {
    const res = await fetch("/geo/guatemala-outline.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function projectPoint(lon, lat, bounds, boxX, boxY, boxSize, padding) {
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;
  const scale = (boxSize - padding * 2) / Math.max(lonSpan, latSpan);
  const w = lonSpan * scale;
  const h = latSpan * scale;
  const offsetX = boxX + (boxSize - w) / 2;
  const offsetY = boxY + (boxSize - h) / 2;
  return [offsetX + (lon - bounds.minLon) * scale, offsetY + (bounds.maxLat - lat) * scale];
}

function drawMiniMap(ctx, { quake, outline, band, boxX, boxY, boxSize }) {
  roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!outline?.ring) return;

  const padding = 28;
  const lons = outline.ring.map((p) => p[0]);
  const lats = outline.ring.map((p) => p[1]);
  const bounds = { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };

  ctx.save();
  roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.clip();

  ctx.beginPath();
  outline.ring.forEach(([lon, lat], i) => {
    const [x, y] = projectPoint(lon, lat, bounds, boxX, boxY, boxSize, padding);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const [ex, ey] = projectPoint(quake.lon, quake.lat, bounds, boxX, boxY, boxSize, padding);
  ctx.fillStyle = `${band.color}33`;
  ctx.beginPath();
  ctx.arc(ex, ey, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = band.color;
  ctx.beginPath();
  ctx.arc(ex, ey, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.font = '600 22px "Inter"';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("GUATEMALA", boxX + 20, boxY + 30);
}

function fitFontSize(ctx, text, maxWidth, family, weight, startSize, minSize = 20) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "${family}"`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "${family}"`;
  }
  return size;
}

export async function drawQuakeShareCard(canvas, { quake, geologia, width = WIDTH, height = HEIGHT }) {
  canvas.width = width;
  canvas.height = height;
  const scale = width / WIDTH;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const [, outline] = await Promise.all([ensureFonts(), loadGuatemalaOutline()]);

  const band = severityFor(quake.magnitude);
  const zone = nearestZone(quake.lat, quake.lon);
  const fault = nearestFault(quake.lat, quake.lon, geologia);

  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH / 2, 220, 50, WIDTH / 2, 220, 560);
  glow.addColorStop(0, `${band.color}33`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, 700);

  const padX = 80;
  let y = 100;

  drawLogo(ctx, padX, y, 72);

  ctx.textBaseline = "middle";
  ctx.font = '700 44px "Space Grotesk"';
  ctx.fillStyle = COLORS.textPrimary;
  ctx.fillText("Terre", padX + 92, y + 36);
  const terreWidth = ctx.measureText("Terre").width;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("Mentor", padX + 92 + terreWidth, y + 36);

  y += 160;

  ctx.textBaseline = "alphabetic";
  ctx.font = '600 30px "Inter"';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("ÚLTIMO SISMO REGISTRADO", padX, y);

  const mapBoxSize = 260;
  drawMiniMap(ctx, {
    quake,
    outline,
    band,
    boxX: WIDTH - padX - mapBoxSize,
    boxY: y - 10,
    boxSize: mapBoxSize,
  });

  y += 210;
  ctx.font = '700 220px "Space Grotesk"';
  ctx.fillStyle = band.color;
  ctx.fillText(String(quake.magnitude), padX, y);
  const magWidth = ctx.measureText(String(quake.magnitude)).width;
  ctx.font = '500 40px "Inter"';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText("magnitud", padX + magWidth + 24, y);

  y += 90;
  const label = band.label.toUpperCase();
  ctx.font = '600 32px "Inter"';
  const labelWidth = ctx.measureText(label).width;
  const pillW = labelWidth + 64;
  const pillH = 64;
  roundRect(ctx, padX, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = band.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = band.color;
  ctx.textBaseline = "middle";
  ctx.fillText(label, padX + 32, y + pillH / 2 + 2);

  y += pillH + 56;

  drawDecorWave(ctx, padX, y, WIDTH - padX * 2, 60, band.color, 0.16);

  y += 90;

  const rows = [
    ["Fecha/hora", quake.datetime],
    ["Ubicación", fault ? `${zone} · ${fault.name} (~${Math.round(fault.distanceKm)} km)` : zone],
    ["Profundidad", `${quake.depthKm ?? "?"} km`],
    ["Coordenadas", `${quake.lat}, ${quake.lon}`],
  ];

  const maxValueWidth = WIDTH - padX * 2;
  ctx.textBaseline = "alphabetic";
  for (const [rowLabel, value] of rows) {
    ctx.fillStyle = band.color;
    ctx.fillRect(padX - 24, y - 34, 4, 56);

    ctx.font = '400 32px "Inter"';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(rowLabel, padX, y);

    const valueSize = fitFontSize(ctx, value, maxValueWidth, "JetBrains Mono", 500, 34);
    ctx.font = `500 ${valueSize}px "JetBrains Mono"`;
    ctx.fillStyle = COLORS.textPrimary;
    ctx.fillText(value, padX, y + 44);
    y += 80;
  }

  // Para sismos leves la comparación con 1976 da ratios absurdamente
  // grandes (millones de veces) que restan seriedad — solo se muestra
  // cuando el sismo es lo bastante fuerte para que la comparación tenga
  // sentido narrativo.
  const historic = quake.magnitude >= 5 ? HISTORICAL_QUAKES.find((q) => q.id === "1976") : null;
  if (historic) {
    y += 16;
    const boxH = 104;
    roundRect(ctx, padX, y, WIDTH - padX * 2, boxH, 16);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(padX, y, 4, boxH);

    const historicYear = historic.date.split(" de ").pop();
    ctx.textBaseline = "alphabetic";
    ctx.font = '600 24px "Inter"';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(`COMPARADO CON EL TERREMOTO DE ${historicYear}`, padX + 32, y + 38);

    const comparisonText = `Ese sismo (M${historic.magnitude}) ${describeEnergyComparison(historic.magnitude, quake.magnitude)} que este.`;
    const compSize = fitFontSize(ctx, comparisonText, WIDTH - padX * 2 - 64, "Inter", 600, 38, 26);
    ctx.font = `600 ${compSize}px "Inter"`;
    ctx.fillStyle = COLORS.textPrimary;
    ctx.fillText(comparisonText, padX + 32, y + 80);

    y += boxH;
  }

  const footerY = y + 60;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, footerY - 40);
  ctx.lineTo(WIDTH - padX, footerY - 40);
  ctx.stroke();

  ctx.font = '400 28px "Inter"';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("Datos públicos de INSIVUMEH · terre-mentor.vercel.app", padX, footerY);
  ctx.fillText("Proyecto desarrollado por hairch.dev", padX, footerY + 40);

  return canvas;
}
