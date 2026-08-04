import { getClima } from "./_lib/fetchClima.js";

export default async function handler(req, res) {
  const departamento = req.query?.departamento;

  if (!departamento) {
    res.status(400).json({ error: "Falta el parámetro departamento" });
    return;
  }

  try {
    const data = await getClima(departamento);
    res.setHeader("Cache-Control", "s-maxage=1200, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener el clima", detail: err.message });
  }
}
