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

// Mismo estilo de tiles que usa el mapa en vivo (SismoMap.jsx) — así la
// tarjeta compartida se ve como un recorte real del mapa, no un dibujo
// aparte.
const TILE_SIZE = 256;
const TILE_SUBDOMAINS = ["a", "b", "c", "d"];

function lonLatToGlobalPixel(lon, lat, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function drawEpicenterMap(ctx, { quake, band, boxX, boxY, boxSize }) {
  roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  const zoom = 7;
  const [px, py] = lonLatToGlobalPixel(quake.lon, quake.lat, zoom);
  const centerTileX = Math.floor(px / TILE_SIZE);
  const centerTileY = Math.floor(py / TILE_SIZE);

  const gridRadius = 1;
  const gridTiles = gridRadius * 2 + 1;
  const offscreen = document.createElement("canvas");
  offscreen.width = gridTiles * TILE_SIZE;
  offscreen.height = gridTiles * TILE_SIZE;
  const octx = offscreen.getContext("2d");

  const loads = [];
  for (let dy = -gridRadius; dy <= gridRadius; dy++) {
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      const tx = centerTileX + dx;
      const ty = centerTileY + dy;
      const s = TILE_SUBDOMAINS[Math.abs(tx + ty) % TILE_SUBDOMAINS.length];
      const url = `https://${s}.basemaps.cartocdn.com/dark_all/${zoom}/${tx}/${ty}.png`;
      loads.push(
        loadImage(url).then((img) => {
          if (img) {
            octx.drawImage(img, (dx + gridRadius) * TILE_SIZE, (dy + gridRadius) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        })
      );
    }
  }
  await Promise.all(loads);

  const originPx = (centerTileX - gridRadius) * TILE_SIZE;
  const originPy = (centerTileY - gridRadius) * TILE_SIZE;
  const epX = px - originPx;
  const epY = py - originPy;

  ctx.save();
  roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.clip();

  const cropSize = boxSize * 1.05;
  ctx.drawImage(offscreen, epX - cropSize / 2, epY - cropSize / 2, cropSize, cropSize, boxX, boxY, boxSize, boxSize);

  const vignette = ctx.createRadialGradient(
    boxX + boxSize / 2,
    boxY + boxSize / 2,
    boxSize * 0.2,
    boxX + boxSize / 2,
    boxY + boxSize / 2,
    boxSize * 0.75
  );
  vignette.addColorStop(0, "rgba(10,13,18,0)");
  vignette.addColorStop(1, "rgba(10,13,18,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(boxX, boxY, boxSize, boxSize);

  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  ctx.fillStyle = `${band.color}33`;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = band.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = band.color;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.page;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  ctx.font = '600 20px "Inter"';
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("EPICENTRO", boxX + 18, boxY + boxSize - 16);
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

  await ensureFonts();

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

  const mapBoxSize = 300;
  await drawEpicenterMap(ctx, {
    quake,
    band,
    boxX: WIDTH - padX - mapBoxSize,
    boxY: y - 50,
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
