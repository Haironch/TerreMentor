import { severityFor } from "./severity";
import { nearestZone } from "./zones";
import { nearestFault } from "./nearestFault";

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

async function ensureFonts() {
  const specs = [
    '700 44px "Space Grotesk"',
    '700 220px "Space Grotesk"',
    '600 30px "Inter"',
    '600 32px "Inter"',
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

  y += pillH + 80;

  const rows = [
    ["Fecha/hora", quake.datetime],
    ["Zona aproximada", zone],
    fault ? ["Falla más cercana", `${fault.name} (~${Math.round(fault.distanceKm)} km)`] : null,
    ["Profundidad", `${quake.depthKm ?? "?"} km`],
    ["Coordenadas", `${quake.lat}, ${quake.lon}`],
  ].filter(Boolean);

  const maxValueWidth = WIDTH - padX * 2;
  ctx.textBaseline = "alphabetic";
  for (const [rowLabel, value] of rows) {
    ctx.font = '400 32px "Inter"';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(rowLabel, padX, y);

    const valueSize = fitFontSize(ctx, value, maxValueWidth, "JetBrains Mono", 500, 34);
    ctx.font = `500 ${valueSize}px "JetBrains Mono"`;
    ctx.fillStyle = COLORS.textPrimary;
    ctx.fillText(value, padX, y + 44);
    y += 90;
  }

  const footerY = HEIGHT - 110;
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
