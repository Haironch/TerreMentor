import { getSismos } from "./_lib/fetchSismos.js";

export default async function handler(req, res) {
  try {
    const force = req.query?.force === "1";
    const data = await getSismos({ force });

    // Cachea en el borde (CDN) para no golpear el origen en cada visita.
    // INSIVUMEH en realidad regenera su página casi en tiempo real (verificado
    // directamente), así que el atraso real es el nuestro — 45s de caché con
    // revalidación en segundo plano da datos frescos sin golpear de más su
    // servidor. Un refresco forzado no debe quedar cacheado en el CDN.
    res.setHeader("Cache-Control", force ? "no-store" : "s-maxage=45, stale-while-revalidate=90");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener datos de INSIVUMEH", detail: err.message });
  }
}
