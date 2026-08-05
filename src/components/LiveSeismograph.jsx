import { useEffect, useMemo, useRef, useState } from "react";
import { severityFor, SEVERITY_BANDS } from "../lib/severity";

const WINDOW_MS = 3 * 60 * 60 * 1000; // ventana visible: últimas 3 horas
const GT_OFFSET = "-06:00"; // Guatemala no usa horario de verano

function parseGtDate(datetime) {
  return new Date(`${datetime.replace(" ", "T")}${GT_OFFSET}`).getTime();
}

export function LiveSeismograph({ quakes }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [recentCount, setRecentCount] = useState(0);

  const events = useMemo(
    () =>
      (quakes ?? [])
        .map((q) => ({ ...q, ts: parseGtDate(q.datetime) }))
        .filter((q) => !Number.isNaN(q.ts)),
    [quakes]
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Repinta de inmediato: en una pestaña en segundo plano el próximo
      // frame animado puede tardar, y no queremos un canvas en blanco tras
      // un resize/rotación mientras tanto.
      draw();
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function draw() {
      const now = Date.now();
      const midY = height / 2;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Línea base: animación ambiental, no representa medición real.
      ctx.strokeStyle = "rgba(57, 135, 229, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = 5;
      for (let x = 0; x <= width; x += step) {
        const wobble = reducedMotion ? 0 : Math.sin((x + now / 45) * 0.02) * 2 + Math.sin((x + now / 110) * 0.05) * 1.1;
        const y = midY + wobble;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Picos: sismos reales dentro de la ventana visible.
      for (const ev of events) {
        const age = now - ev.ts;
        if (age < 0 || age > WINDOW_MS) continue;

        const x = width * (1 - age / WINDOW_MS);
        const band = severityFor(ev.magnitude);
        const amp = Math.min(height / 2 - 10, ev.magnitude * 9);

        ctx.strokeStyle = band.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 7, midY);
        ctx.lineTo(x - 3, midY - amp * 0.55);
        ctx.lineTo(x, midY + amp);
        ctx.lineTo(x + 3, midY - amp * 0.65);
        ctx.lineTo(x + 7, midY);
        ctx.stroke();

        if (!reducedMotion && age < 5 * 60 * 1000) {
          const pulse = (Math.sin(now / 220) + 1) / 2;
          ctx.beginPath();
          ctx.fillStyle = `${band.color}55`;
          ctx.arc(x, midY + amp, 5 + pulse * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(width - 1, 0);
      ctx.lineTo(width - 1, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    let rafId = null;
    let intervalId = null;

    function loop() {
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function handleVisibility() {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        if (intervalId) clearInterval(intervalId);
        rafId = null;
        intervalId = null;
      } else if (!rafId && !intervalId) {
        if (reducedMotion) {
          draw();
          intervalId = setInterval(draw, 4000);
        } else {
          loop();
        }
      }
    }

    if (reducedMotion) {
      draw();
      intervalId = setInterval(draw, 4000);
    } else {
      loop();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [events]);

  useEffect(() => {
    function updateCount() {
      const now = Date.now();
      setRecentCount(events.filter((ev) => now - ev.ts >= 0 && now - ev.ts <= WINDOW_MS).length);
    }
    updateCount();
    const id = setInterval(updateCount, 10_000);
    return () => clearInterval(id);
  }, [events]);

  return (
    <div className="seismograph-card">
      <div className="seismograph-header">
        <h3>Sismógrafo en vivo</h3>
        <span className="seismograph-count">Últimas 3h · {recentCount} sismos</span>
      </div>

      <div ref={containerRef} className="seismograph-canvas-wrap">
        <canvas ref={canvasRef} />
        <div className="seismograph-axis">
          <span>-3h</span>
          <span>-2h</span>
          <span>-1h</span>
          <span>ahora</span>
        </div>
      </div>

      <div className="seismograph-legend">
        {SEVERITY_BANDS.map((band) => (
          <span key={band.key} className="chart-legend-item">
            <i style={{ background: band.color }} />
            {band.label}
          </span>
        ))}
      </div>

      <p className="seismograph-note">
        Los picos son sismos reales registrados por INSIVUMEH; la línea base es una animación ambiental, no una
        medición sísmica en tiempo real.
      </p>
    </div>
  );
}
