import { parseSismosHtml } from "./parseSismos.js";

const SOURCE_URL = "https://geo.insivumeh.gob.gt/sismo";
const TTL_MS = 60_000;
// Aun con "force" (botón de refresco manual), nunca pedimos el HTML a
// INSIVUMEH más seguido que esto, para que un uso descuidado del botón no
// termine golpeando su servidor.
const MIN_FORCE_INTERVAL_MS = 15_000;

let cache = { data: null, fetchedAt: 0 };

export async function getSismos({ force = false } = {}) {
  const now = Date.now();
  const withinTtl = cache.data && now - cache.fetchedAt < TTL_MS;
  const withinForceFloor = cache.data && now - cache.fetchedAt < MIN_FORCE_INTERVAL_MS;

  if (withinTtl || (force && withinForceFloor)) {
    return cache.data;
  }

  const upstream = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "TerreMentor/1.0 (proyecto comunitario de monitoreo sismico GT; https://github.com/)",
    },
  });

  if (!upstream.ok) {
    throw new Error(`INSIVUMEH respondió ${upstream.status}`);
  }

  const html = await upstream.text();
  const data = parseSismosHtml(html);

  cache = { data, fetchedAt: now };
  return data;
}
