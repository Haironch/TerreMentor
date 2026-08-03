import { getSismos } from "./_lib/fetchSismos.js";

export default async function handler(req, res) {
  try {
    const force = req.query?.force === "1";
    const data = await getSismos({ force });

    // Cachea en el borde (CDN) para no golpear el origen en cada visita.
    // El sitio de INSIVUMEH se regenera cada pocos minutos, así que 3 min de
    // caché con revalidación en segundo plano es un buen balance. Un refresco
    // forzado no debe quedar cacheado en el CDN.
    res.setHeader("Cache-Control", force ? "no-store" : "s-maxage=180, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener datos de INSIVUMEH", detail: err.message });
  }
}
