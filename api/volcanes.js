import { getVolcanes } from "./_lib/fetchVolcanes.js";

export default async function handler(req, res) {
  try {
    const data = await getVolcanes();
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener el estado volcánico", detail: err.message });
  }
}
