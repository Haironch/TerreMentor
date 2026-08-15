import { getWorldQuakes } from "./_lib/fetchWorldQuakes.js";

export default async function handler(req, res) {
  try {
    const force = req.query?.force === "1";
    const data = await getWorldQuakes({ force });
    res.setHeader("Cache-Control", force ? "no-store" : "s-maxage=1800, stale-while-revalidate=900");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener datos del USGS", detail: err.message });
  }
}
