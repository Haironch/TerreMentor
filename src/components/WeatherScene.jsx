import { useEffect, useRef } from "react";

// Animación de clima a pantalla completa dibujada en un <canvas>.
// kind: "lluvia" | "calor" | "frio"

const rand = (min, max) => min + Math.random() * (max - min);

function rainScene(w, h) {
  const slant = 0.18; // desplazamiento horizontal por cada px que cae
  const count = Math.round(Math.min(380, (w * h) / 5000));
  const makeDrop = (initial) => ({
    x: rand(-h * slant, w),
    y: initial ? rand(-h, h) : rand(-200, -20),
    len: rand(14, 30),
    speed: rand(900, 1500),
    alpha: rand(0.25, 0.6),
    width: rand(0.8, 1.6),
  });
  const drops = Array.from({ length: count }, () => makeDrop(true));
  const ripples = [];
  const flashAt = rand(0.9, 1.4);

  return (ctx, dt, t) => {
    const tint = ctx.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, "rgba(40, 70, 120, 0.35)");
    tint.addColorStop(1, "rgba(10, 20, 40, 0.08)");
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);

    // Un relámpago suave, una sola vez
    const sinceFlash = t - flashAt;
    if (sinceFlash > 0 && sinceFlash < 0.35) {
      const strength = sinceFlash < 0.08 ? 0.16 : sinceFlash < 0.14 ? 0.03 : 0.1 * (1 - sinceFlash / 0.35);
      ctx.fillStyle = `rgba(200, 220, 255, ${strength})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.lineCap = "round";
    for (const d of drops) {
      d.y += d.speed * dt;
      d.x += d.speed * slant * dt;
      if (d.y - d.len > h) {
        if (Math.random() < 0.35) ripples.push({ x: d.x, y: h - rand(4, 50), max: rand(6, 14), life: 1 });
        Object.assign(d, makeDrop(false));
      }
      ctx.strokeStyle = `rgba(170, 200, 240, ${d.alpha})`;
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * slant, d.y - d.len);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life -= dt * 2.2;
      if (r.life <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      const radius = r.max * (1 - r.life);
      ctx.strokeStyle = `rgba(170, 200, 240, ${0.5 * r.life})`;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
}

function heatScene(w, h) {
  const narrow = w < 700;
  const cx = w * (narrow ? 0.72 : 0.8);
  const cy = h * (narrow ? 0.16 : 0.2);
  const R = Math.min(w, h) * 0.08 + 22;
  const rays = 14;
  const makeMote = (initial) => ({
    x: rand(0, w),
    y: initial ? rand(0, h) : h + rand(0, 40),
    r: rand(1, 3.2),
    speed: rand(20, 60),
    wobble: rand(0.5, 1.5),
    phase: rand(0, Math.PI * 2),
    alpha: rand(0.2, 0.55),
  });
  const motes = Array.from({ length: Math.round(Math.min(120, (w * h) / 12000)) }, () => makeMote(true));

  return (ctx, dt, t) => {
    const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.95);
    wash.addColorStop(0, "rgba(255, 170, 60, 0.30)");
    wash.addColorStop(0.4, "rgba(255, 120, 40, 0.10)");
    wash.addColorStop(1, "rgba(255, 90, 30, 0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    // Rayos girando despacio
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.15);
    for (let i = 0; i < rays; i++) {
      const len = R * (i % 2 ? 0.9 : 1.7);
      const half = R * 0.16;
      ctx.fillStyle = `rgba(255, 205, 100, ${0.16 + 0.07 * Math.sin(t * 2 + i)})`;
      ctx.beginPath();
      ctx.moveTo(R * 1.25, -half);
      ctx.lineTo(R * 1.25 + len, 0);
      ctx.lineTo(R * 1.25, half);
      ctx.closePath();
      ctx.fill();
      ctx.rotate((Math.PI * 2) / rays);
    }
    ctx.restore();

    // Brillo que late
    const pulse = 1 + 0.05 * Math.sin(t * 2.2);
    const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3.2 * pulse);
    glow.addColorStop(0, "rgba(255, 215, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 180, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 3.2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    const disk = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    disk.addColorStop(0, "#fff6d0");
    disk.addColorStop(0.6, "#ffd36b");
    disk.addColorStop(1, "#ffa83d");
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Partículas de calor que suben
    for (const m of motes) {
      m.y -= m.speed * dt;
      m.x += Math.sin(t * m.wobble + m.phase) * 14 * dt;
      if (m.y < -10) Object.assign(m, makeMote(false));
      ctx.fillStyle = `rgba(255, 190, 100, ${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function windScene(w, h) {
  const makeGust = (initial) => {
    const len = rand(w * 0.15, w * 0.4) + 80;
    return {
      len,
      x: initial ? rand(0, w + len) : -rand(0, w * 0.4),
      y: rand(h * 0.05, h * 0.95),
      speed: rand(500, 900),
      amp: rand(6, 22),
      freq: rand(0.006, 0.014),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.18, 0.45),
      width: rand(1, 2.2),
    };
  };
  const gusts = Array.from({ length: Math.round(Math.min(28, h / 28)) }, () => makeGust(true));
  const makeFlake = (initial) => ({
    x: initial ? rand(0, w) : -rand(0, 40),
    y: rand(0, h),
    r: rand(0.8, 2.4),
    speed: rand(300, 700),
    wobble: rand(1, 3),
    phase: rand(0, Math.PI * 2),
    alpha: rand(0.3, 0.8),
  });
  const flakes = Array.from({ length: Math.round(Math.min(110, (w * h) / 9000)) }, () => makeFlake(true));
  const steps = 26;

  return (ctx, dt, t) => {
    const tint = ctx.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, "rgba(120, 170, 225, 0.22)");
    tint.addColorStop(1, "rgba(60, 100, 160, 0.04)");
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);

    ctx.lineCap = "round";
    for (const g of gusts) {
      g.x += g.speed * dt;
      if (g.x - g.len > w) Object.assign(g, makeGust(false));
      const tail = g.x - g.len;
      const stroke = ctx.createLinearGradient(tail, 0, g.x, 0);
      stroke.addColorStop(0, "rgba(210, 230, 255, 0)");
      stroke.addColorStop(0.7, `rgba(210, 230, 255, ${g.alpha})`);
      stroke.addColorStop(1, "rgba(210, 230, 255, 0)");
      ctx.strokeStyle = stroke;
      ctx.lineWidth = g.width;
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const px = tail + (g.len * k) / steps;
        const py = g.y + Math.sin(px * g.freq + t * 2 + g.phase) * g.amp;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    for (const f of flakes) {
      f.x += f.speed * dt;
      f.y += Math.sin(t * f.wobble + f.phase) * 40 * dt;
      if (f.x > w + 10) Object.assign(f, makeFlake(false));
      ctx.fillStyle = `rgba(235, 245, 255, ${f.alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
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
    let w = 0;
    let h = 0;
    let draw = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw = createScene(w, h);
    }

    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let last = start;
    let raf = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      draw(ctx, dt, (now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [kind]);

  return <canvas ref={canvasRef} className="weather-scene" aria-hidden="true" />;
}
