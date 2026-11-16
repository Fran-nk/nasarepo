import puntos from "./datos/contexto_puntos.json";
import cultivos from "./datos/catalogo_cultivos.json";
import zonas from "./datos/cultivos-por-zona.json";
import { cargarModelo } from "./modelo/cargar";
import { puntuar } from "./modelo/mlp";
import { normalizarVariables } from "./modelo/variables";
import spec from "./modelo/artefactos/feature-spec.json";

type Cultivo = (typeof cultivos)[number];
type Punto = (typeof puntos)[number];
export class ErrorContexto extends Error { constructor(public status: number, public codigo: string, mensaje: string) { super(mensaje); } }

function distancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180, dlat = (lat2 - lat1) * rad, dlon = (lon2 - lon1) * rad;
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function buscarPunto(lat: number, lon: number): { punto: Punto; distancia_km: number } {
  let mejor = puntos[0], menor = Infinity;
  for (const p of puntos) {
    const d = distancia(lat, lon, p.latitud, p.longitud);
    if (d < menor) { mejor = p; menor = d; }
  }
  if (menor > 30) throw new ErrorContexto(503, "DATOS_NO_DISPONIBLES", "No hay un punto climático de referencia a menos de 30 km de la ubicación.");
  return { punto: mejor, distancia_km: menor };
}

export function construirVariables(p: Punto, mes: number, historial: (Cultivo | undefined)[], candidato: Cultivo): Record<string, number> {
  const comun = (zonas.zonas as Record<string, string[]>)[p.zona] ?? [];
  const v: Record<string, number> = {};
  for (const f of spec.features) v[f.nombre] = 0;
  Object.assign(v, { altitud_m: p.altitud_m, ph_suelo: p.ph, lluvia_anual_mm: p.lluvia_anual_mm,
    humedad_raices_siembra: p.gwetroot[mes - 1], temp_media_siembra_c: p.t2m[mes - 1],
    mes_sin: Math.sin(2 * Math.PI * mes / 12), mes_cos: Math.cos(2 * Math.PI * mes / 12) });
  v[`zona_${p.zona}`] = 1;
  for (let i = 0; i < 3; i++) v[`prev${i + 1}_familia_${historial[i]?.familia ?? "ninguno"}`] = 1;
  v[`prev1_categoria_${historial[0]?.categoria ?? "ninguno"}`] = 1;
  const meses = Array.from({ length: Math.min(12, Math.ceil(candidato.ciclo_dias / 30)) }, (_, i) => (mes - 1 + i) % 12);
  const serie = (nombre: "t2m" | "t2m_min" | "t2m_max" | "lluvia_mm" | "rh2m" | "radiacion" | "gwetroot") => meses.map((i) => p[nombre][i]);
  const promedio = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  Object.assign(v, { temp_media_ciclo_c: promedio(serie("t2m")), temp_min_ciclo_c: Math.min(...serie("t2m_min")), temp_max_ciclo_c: Math.max(...serie("t2m_max")),
    lluvia_ciclo_mm: serie("lluvia_mm").reduce((a, b) => a + b, 0), humedad_relativa_ciclo_pct: promedio(serie("rh2m")), radiacion_ciclo_mj_m2_dia: promedio(serie("radiacion")), humedad_raices_ciclo: promedio(serie("gwetroot")),
    candidato_altura_min_m: candidato.altura_min_m, candidato_altura_max_m: candidato.altura_max_m, candidato_ciclo_dias: candidato.ciclo_dias,
    candidato_comun_en_zona: Number(comun.includes(candidato.cultivo_id)) });
  const rangos = ["tmin", "topmn", "topmx", "tmax", "rmin", "ropmn", "ropmx", "rmax", "phmin", "phopmn", "phopmx", "phmax", "ktmp"] as const;
  for (const r of rangos) v[`candidato_${r}`] = candidato[r];
  v[`candidato_familia_${candidato.familia}`] = 1;
  v[`candidato_categoria_${candidato.categoria}`] = 1;
  return v;
}

export async function recomendar(latitud: number, longitud: number, mes: number, historialIds: string[], limite = 5) {
  const { punto, distancia_km } = buscarPunto(latitud, longitud);
  const previos = historialIds.map((id) => {
    const cultivo = cultivos.find((c) => c.cultivo_id === id);
    if (!cultivo) throw new ErrorContexto(404, "CULTIVO_DESCONOCIDO", `El cultivo '${id}' no existe en el catálogo de rotación.`);
    return cultivo;
  });
  const modelo = await cargarModelo();
  if (!modelo) throw new ErrorContexto(503, "DATOS_NO_DISPONIBLES", "Modelo no disponible.");
  const comunes = (zonas.zonas as Record<string, string[]>)[punto.zona] ?? [];
  const recomendaciones = cultivos.map((c) => {
    const base = puntuar(modelo, normalizarVariables(modelo, construirVariables(punto, mes, previos, c)));
    const bono = c.rareza === "en_rescate" ? 0.05 : 0;
    return { cultivo_id: c.cultivo_id, nombre: c.nombre, familia: c.familia, categoria: c.categoria, ciclo_dias: c.ciclo_dias,
      porcentaje_afinidad: Math.round(Math.min(1, base + bono) * 10000) / 100, porcentaje_base: Math.round(base * 10000) / 100,
      bono_rescate_puntos: Math.round((Math.min(1, base + bono) - base) * 10000) / 100, en_rescate: c.rareza === "en_rescate", motivos: [], advertencias: [], ficha_url: `/semillas/${c.cultivo_id}` };
  }).sort((a, b) => b.porcentaje_afinidad - a.porcentaje_afinidad || a.cultivo_id.localeCompare(b.cultivo_id)).slice(0, limite).map((r, i) => ({ posicion: i + 1, ...r }));
  return { version_api: "1", catalogo_version: "dataset-v1", punto: { latitud, longitud }, altitud_m: punto.altitud_m,
    zona: { id: punto.zona.replaceAll("_", "-"), nombre: punto.zona.replaceAll("_", " "), vertiente: punto.vertiente },
    catalogo_zona: cultivos.filter((c) => comunes.includes(c.cultivo_id)).map((c) => ({ id: c.cultivo_id, nombre: c.nombre, familia: c.familia, categoria: c.categoria, perenne: false })),
    recomendaciones, agroforesteria: [], metodo: "red_neuronal", modelo: { algoritmo: "mlp", version: modelo.version },
    referencia: { punto_id: punto.punto_id, latitud: punto.latitud, longitud: punto.longitud, distancia_km: Math.round(distancia_km * 10) / 10 },
    fuentes: { clima: { proveedor: "NASA_POWER" }, suelo: { proveedor: "SOILGRIDS" }, altitud: { proveedor: "OPEN_METEO" } },
    avisos: [{ codigo: "CONTEXTO_APROXIMADO", mensaje: `Se usan datos históricos del punto de referencia situado a ${distancia_km.toFixed(1)} km; altitud, zona, clima y suelo pueden diferir de la parcela.` },
      { codigo: "MODELO_PROVISIONAL", mensaje: "Afinidad estimada con reglas sintéticas y datos pendientes de validación agronómica; no es probabilidad de cosecha." },
      ...(punto.vertiente_ambigua ? [{ codigo: "VERTIENTE_AMBIGUA", mensaje: "La vertiente del punto de referencia es aproximada." }] : [])] };
}
