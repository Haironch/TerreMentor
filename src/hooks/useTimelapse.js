import { useEffect, useMemo, useState } from "react";
import { parseGtDatetime, formatGtDatetime } from "../lib/time";

const PLAYBACK_DURATION_MS = 24_000;

export function useTimelapse(quakes) {
  const [playbackTime, setPlaybackTime] = useState(null); // null = mostrar todo, fuera de reproducción
  const [isPlaying, setIsPlaying] = useState(false);

  const timedQuakes = useMemo(
    () =>
      (quakes ?? [])
        .map((q) => ({ ...q, ts: parseGtDatetime(q.datetime) }))
        .filter((q) => !Number.isNaN(q.ts))
        .sort((a, b) => a.ts - b.ts),
    [quakes]
  );

  const minTime = timedQuakes[0]?.ts ?? null;
  const maxTime = timedQuakes[timedQuakes.length - 1]?.ts ?? null;

  // Si cambia el set de datos (p.ej. cambió el rango seleccionado), reinicia.
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(null);
  }, [quakes]);

  useEffect(() => {
    if (!isPlaying || minTime == null || maxTime == null) return undefined;

    let rafId;
    let lastFrame = performance.now();
    const span = Math.max(maxTime - minTime, 1);
    const speed = span / PLAYBACK_DURATION_MS;

    function tick(now) {
      const delta = now - lastFrame;
      lastFrame = now;
      setPlaybackTime((current) => {
        const base = current ?? minTime;
        const next = base + delta * speed;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, minTime, maxTime]);

  function togglePlay() {
    if (minTime == null || maxTime == null) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setPlaybackTime((current) => (current == null || current >= maxTime ? minTime : current));
    setIsPlaying(true);
  }

  function scrub(fraction) {
    if (minTime == null || maxTime == null) return;
    setIsPlaying(false);
    setPlaybackTime(minTime + fraction * (maxTime - minTime));
  }

  const displayQuakes = playbackTime == null ? quakes ?? [] : timedQuakes.filter((q) => q.ts <= playbackTime);
  const progress =
    playbackTime == null || minTime == null || maxTime == null
      ? 1
      : (playbackTime - minTime) / Math.max(maxTime - minTime, 1);
  const label = playbackTime == null ? "En vivo" : formatGtDatetime(playbackTime);

  return {
    displayQuakes,
    isPlaying,
    progress,
    label,
    togglePlay,
    scrub,
    canPlay: timedQuakes.length > 1,
  };
}
