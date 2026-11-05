import { useEffect, useRef } from "react";

// Animación de clima a pantalla completa dibujada en un <canvas>.
// kind: "lluvia" | "calor" | "frio"
//
// Pensada para no saturar dispositivos modestos:
// - El tinte de fondo y el relámpago son CSS (los pinta el compositor, no el canvas).
// - Las partículas se agrupan en 3 estilos y se dibujan con un solo trazo por estilo.
// - El sol se pre-dibuja una vez en imágenes y en cada frame solo se rota/escala.
// - Los gradientes se crean una vez, no en cada frame.
// - Resolución máxima 1.5x y menos partículas en equipos de gama baja; si aun así
//   va lento, baja la calidad sola mientras corre.

const rand = (min, max) => min + Math.random() * (max - min);
const pickStyle = () => Math.floor(Math.random() * 3);

const QUALITY_LEVELS = [
  { density: 1, maxDpr: 1.5 },
  { density: 0.6, maxDpr: 1 },
  { density: 0.35, maxDpr: 1 },
];

// Medición en vivo: si el dibujo tarda más que esto, o los frames llegan muy
// espaciados, se baja un nivel de calidad.
const WARMUP_FRAMES = 6;
const SAMPLE_FRAMES = 20;
const SLOW_DRAW_MS = 4;
const SLOW_FRAME_MS = 40;

function initialQualityLevel() {
  if (typeof navigator === "undefined") return 0;
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
  const fewCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  const saveData = navigator.connection?.saveData;
  return lowMemory || fewCores || saveData ? 1 : 0;
}

function makeSprite(size, dpr, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * dpr);
  canvas.height = Math.ceil(size * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  paint(ctx, size / 2);
  return canvas;
}

function rainScene(w, h, { density }) {
  const slant = 0.18; // desplazamiento horizontal por cada px que cae
  const styles = [
    { color: "rgba(170, 200, 240, 0.28)", width: 0.9 },
    { color: "rgba(170, 200, 240, 0.42)", width: 1.2 },
    { color: "rgba(170, 200, 240, 0.58)", width: 1.5 },
  ];
  const count = Math.max(40, Math.round(Math.min(380, (w * h) / 5000) * density));
  const makeDrop = (drop, initial) => {
    drop.x = rand(-h * slant, w);
    drop.y = initial ? rand(-h, h) : rand(-200, -20);
    drop.len = rand(14, 30);
    drop.speed = rand(900, 1500);
    return drop;
  };
  const groups = [[], [], []];
  for (let i = 0; i < count; i++) groups[pickStyle()].push(makeDrop({}, true));

  const ripples = [];
  const maxRipples = Math.round(40 * density) + 10;

  return (ctx, dt) => {
    ctx.lineCap = "butt";
    for (let s = 0; s < 3; s++) {
      ctx.strokeStyle = styles[s].color;
      ctx.lineWidth = styles[s].width;
      ctx.beginPath();
      for (const d of groups[s]) {
        d.y += d.speed * dt;
        d.x += d.speed * slant * dt;
        if (d.y - d.len > h) {
          if (ripples.length < maxRipples && Math.random() < 0.35) {
            ripples.push({ x: d.x, y: h - rand(4, 50), max: rand(6, 14), life: 1 });
          }
          makeDrop(d, false);
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * slant, d.y - d.len);
      }
      ctx.stroke();
    }

    // Ondas en el suelo: 3 niveles de opacidad según cuánto les queda de vida
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].life -= dt * 2.2;
      if (ripples[i].life <= 0) ripples.splice(i, 1);
    }
    ctx.lineWidth = 1;
    for (let s = 0; s < 3; s++) {
      const lo = s / 3;
      const hi = (s + 1) / 3;
      ctx.strokeStyle = `rgba(170, 200, 240, ${0.5 * hi})`;
      ctx.beginPath();
      for (const r of ripples) {
        if (r.life <= lo || r.life > hi) continue;
        const radius = r.max * (1 - r.life);
        ctx.moveTo(r.x + radius, r.y);
        ctx.ellipse(r.x, r.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  };
}

function heatScene(w, h, { density, dpr }) {
  const narrow = w < 700;
  const cx = w * (narrow ? 0.72 : 0.8);
  const cy = h * (narrow ? 0.16 : 0.2);
  const R = Math.min(w, h) * 0.08 + 22;
  const rays = 14;

  // Rayos, brillo y disco se dibujan una sola vez
  const raysSize = (R * 1.25 + R * 1.7) * 2 + 4;
  const raysSprite = makeSprite(raysSize, dpr, (ctx, c) => {
    ctx.translate(c, c);
    ctx.fillStyle = "rgba(255, 205, 100, 0.2)";
    for (let i = 0; i < rays; i++) {
      const len = R * (i % 2 ? 0.9 : 1.7);
      const half = R * 0.16;
      ctx.beginPath();
      ctx.moveTo(R * 1.25, -half);
      ctx.lineTo(R * 1.25 + len, 0);
      ctx.lineTo(R * 1.25, half);
      ctx.closePath();
      ctx.fill();
      ctx.rotate((Math.PI * 2) / rays);
    }
  });
  const glowSize = R * 3.2 * 2;
  const glowSprite = makeSprite(glowSize, dpr, (ctx, c) => {
    const glow = ctx.createRadialGradient(c, c, R * 0.6, c, c, c);
    glow.addColorStop(0, "rgba(255, 215, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 180, 80, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, c * 2, c * 2);
  });
  const diskSize = R * 2 + 2;
  const diskSprite = makeSprite(diskSize, dpr, (ctx, c) => {
    const disk = ctx.createRadialGradient(c - R * 0.3, c - R * 0.3, R * 0.1, c, c, R);
    disk.addColorStop(0, "#fff6d0");
    disk.addColorStop(0.6, "#ffd36b");
    disk.addColorStop(1, "#ffa83d");
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.fill();
  });

  const moteStyles = ["rgba(255, 190, 100, 0.22)", "rgba(255, 190, 100, 0.38)", "rgba(255, 190, 100, 0.55)"];
  const makeMote = (m, initial) => {
    m.x = rand(0, w);
    m.y = initial ? rand(0, h) : h + rand(0, 40);
    m.r = rand(1, 3.2);
    m.speed = rand(20, 60);
    m.wobble = rand(0.5, 1.5);
    m.phase = rand(0, Math.PI * 2);
    return m;
  };
  const moteCount = Math.max(20, Math.round(Math.min(120, (w * h) / 12000) * density));
  const motes = [[], [], []];
  for (let i = 0; i < moteCount; i++) motes[pickStyle()].push(makeMote({}, true));

  return (ctx, dt, t) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.15);
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 2);
    ctx.drawImage(raysSprite, -raysSize / 2, -raysSize / 2, raysSize, raysSize);
    ctx.restore();

    const pulse = 1 + 0.05 * Math.sin(t * 2.2);
    const g = glowSize * pulse;
    ctx.drawImage(glowSprite, cx - g / 2, cy - g / 2, g, g);
    ctx.drawImage(diskSprite, cx - diskSize / 2, cy - diskSize / 2, diskSize, diskSize);

    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = moteStyles[s];
      ctx.beginPath();
      for (const m of motes[s]) {
        m.y -= m.speed * dt;
        m.x += Math.sin(t * m.wobble + m.phase) * 14 * dt;
        if (m.y < -10) makeMote(m, false);
        ctx.moveTo(m.x + m.r, m.y);
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  };
}

function windScene(w, h, { density, dpr }) {
  const steps = 18;
  const makeGust = (ctx, g, initial) => {
    g.len = rand(w * 0.15, w * 0.4) + 80;
    g.x = initial ? rand(0, w + g.len) : -rand(0, w * 0.4);
    g.y = rand(h * 0.05, h * 0.95);
    g.speed = rand(500, 900);
    g.amp = rand(6, 22);
    g.freq = rand(0.006, 0.014);
    g.phase = rand(0, Math.PI * 2);
    g.width = rand(1, 2.2);
    // Gradiente en coordenadas locales de la ráfaga (0 = cola, len = punta),
    // creado una sola vez por ráfaga.
    const alpha = rand(0.18, 0.45);
    g.stroke = ctx.createLinearGradient(0, 0, g.len, 0);
    g.stroke.addColorStop(0, "rgba(210, 230, 255, 0)");
    g.stroke.addColorStop(0.7, `rgba(210, 230, 255, ${alpha})`);
    g.stroke.addColorStop(1, "rgba(210, 230, 255, 0)");
    return g;
  };
  const gustCount = Math.max(8, Math.round(Math.min(24, h / 32) * density));
  let gusts = null;

  const flakeStyles = ["rgba(235, 245, 255, 0.35)", "rgba(235, 245, 255, 0.55)", "rgba(235, 245, 255, 0.8)"];
  const makeFlake = (f, initial) => {
    f.x = initial ? rand(0, w) : -rand(0, 40);
    f.y = rand(0, h);
    f.r = rand(0.8, 2.4);
    f.speed = rand(300, 700);
    f.wobble = rand(1, 3);
    f.phase = rand(0, Math.PI * 2);
    return f;
  };
  const flakeCount = Math.max(25, Math.round(Math.min(110, (w * h) / 9000) * density));
  const flakes = [[], [], []];
  for (let i = 0; i < flakeCount; i++) flakes[pickStyle()].push(makeFlake({}, true));

  return (ctx, dt, t) => {
    if (!gusts) gusts = Array.from({ length: gustCount }, () => makeGust(ctx, {}, true));

    ctx.lineCap = "round";
    for (const g of gusts) {
      g.x += g.speed * dt;
      if (g.x - g.len > w) makeGust(ctx, g, false);
      const tail = g.x - g.len;
      ctx.setTransform(dpr, 0, 0, dpr, tail * dpr, 0);
      ctx.strokeStyle = g.stroke;
      ctx.lineWidth = g.width;
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const local = (g.len * k) / steps;
        const py = g.y + Math.sin((tail + local) * g.freq + t * 2 + g.phase) * g.amp;
        if (k === 0) ctx.moveTo(local, py);
        else ctx.lineTo(local, py);
      }
      ctx.stroke();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = flakeStyles[s];
      ctx.beginPath();
      for (const f of flakes[s]) {
        f.x += f.speed * dt;
        f.y += Math.sin(t * f.wobble + f.phase) * 40 * dt;
        if (f.x > w + 10) makeFlake(f, false);
        ctx.moveTo(f.x + f.r, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  };
}

const SCENES = { lluvia: rainScene, calor: heatScene, frio: windScene };

export function WeatherScene({ kind }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const createScene = SCENES[kind];
    if (!canvas || !createScene) return undefined;

    const ctx = canvas.getContext("2d");
    let level = initialQualityLevel();
    let w = 0;
    let h = 0;
    let draw = null;

    function setup() {
      const { density, maxDpr } = QUALITY_LEVELS[level];
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw = createScene(w, h, { density, dpr });
    }

    setup();
    window.addEventListener("resize", setup);

    const start = performance.now();
    let last = start;
    let raf = 0;
    let frames = 0;
    let drawTotal = 0;
    let gapTotal = 0;

    function frame(now) {
      const gap = now - last;
      const dt = Math.min(gap / 1000, 0.05);
      last = now;

      const t0 = performance.now();
      ctx.clearRect(0, 0, w, h);
      draw(ctx, dt, (now - start) / 1000);
      const drawMs = performance.now() - t0;

      // Calidad adaptativa: si va lento, menos partículas y menos resolución.
      frames += 1;
      if (frames > WARMUP_FRAMES && level < QUALITY_LEVELS.length - 1) {
        drawTotal += drawMs;
        gapTotal += gap;
        if (frames === WARMUP_FRAMES + SAMPLE_FRAMES) {
          const slow = drawTotal / SAMPLE_FRAMES > SLOW_DRAW_MS || gapTotal / SAMPLE_FRAMES > SLOW_FRAME_MS;
          if (slow) {
            level += 1;
            setup();
          }
          frames = 0;
          drawTotal = 0;
          gapTotal = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setup);
    };
  }, [kind]);

  return (
    <>
      <canvas ref={canvasRef} className={`weather-layer weather-scene weather-scene-${kind}`} aria-hidden="true" />
      {kind === "lluvia" && <div className="weather-layer weather-flash" aria-hidden="true" />}
    </>
  );
}
