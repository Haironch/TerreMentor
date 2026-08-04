const TTL_MS = 15 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

const UA = {
  "User-Agent": "TerreMentor/1.0 (proyecto comunitario de monitoreo GT; https://github.com/)",
};

const VOLCANOES = [
  { nombre: "Fuego", codigo: "BEFGO" },
  { nombre: "Pacaya", codigo: "BEPAC" },
  { nombre: "Santiaguito", codigo: "BESAN" },
];

const SUFIJOS = ["_activo.pdf", "_Activo.pdf", "_ACTIVO.pdf"];

async function existe(url) {
  try {
    const res = await fetch(url, { method: "HEAD", headers: UA });
    return res.ok;
  } catch {
    return false;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

async function buscarBoletinDiario() {
  const hoy = new Date();
  for (let i = 0; i < 5; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const anio = fecha.getFullYear();
    const mes = pad(fecha.getMonth() + 1);
    const dia = pad(fecha.getDate());
    const url = `https://insivumeh.gob.gt/wp-content/uploads/${anio}/${mes}/BVD-${anio}-${mes}-${dia}.pdf`;
    if (await existe(url)) {
      return { url, fecha: `${anio}-${mes}-${dia}` };
    }
  }
  return null;
}

async function buscarBoletinEspecial({ codigo }) {
  // El boletín "activo" normalmente vive en la raíz de uploads mientras dura
  // la fase eruptiva. Si no está ahí, se revisan el mes actual y el anterior
  // por si quedó archivado con fecha.
  const candidatos = [];
  for (const sufijo of SUFIJOS) {
    candidatos.push(`https://insivumeh.gob.gt/wp-content/uploads/${codigo}${sufijo}`);
  }

  const hoy = new Date();
  for (let m = 0; m < 2; m++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
    const anio = fecha.getFullYear();
    const mes = pad(fecha.getMonth() + 1);
    for (const sufijo of SUFIJOS) {
      candidatos.push(`https://insivumeh.gob.gt/wp-content/uploads/${anio}/${mes}/${codigo}${sufijo}`);
    }
  }

  const resultados = await Promise.all(candidatos.map(async (url) => ((await existe(url)) ? url : null)));
  return resultados.find(Boolean) ?? null;
}

export async function getVolcanes() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < TTL_MS) {
    return cache.data;
  }

  const [boletinDiario, ...especiales] = await Promise.all([
    buscarBoletinDiario(),
    ...VOLCANOES.map((v) => buscarBoletinEspecial(v)),
  ]);

  const data = {
    fetchedAt: new Date().toISOString(),
    boletinDiario,
    volcanes: VOLCANOES.map((v, i) => ({
      nombre: v.nombre,
      activo: Boolean(especiales[i]),
      boletinUrl: especiales[i],
    })),
  };

  cache = { data, fetchedAt: now };
  return data;
}
