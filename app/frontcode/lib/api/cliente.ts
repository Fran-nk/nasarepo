/**
 * Cliente de datos. Con NEXT_PUBLIC_USE_MOCKS distinto de "false" lee los
 * escenarios de prueba de /mocks; si no, llama al backend en NEXT_PUBLIC_API_URL.
 * Las pantallas solo usan estas funciones: conectar el backend real no las cambia.
 */
import type {
  Alerta,
  DiaClima,
  PeticionRecomendaciones,
  RespuestaAlertas,
  RespuestaContexto,
  RespuestaElNino,
  RespuestaRecomendaciones,
  RespuestaRiego,
  RespuestaSemaforo,
  RespuestaSemana,
  RespuestaSemillas,
  RespuestaVsNormal,
} from "@/app/frontcode/lib/contratos/tipos";
import { ESCENARIOS, type IdEscenario } from "@/app/frontcode/lib/escenarios";
import catalogo from "@/app/frontcode/mocks/semillas.json";

export const USAR_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export interface Punto {
  lat: number;
  lon: number;
}

/** "D+3" → fecha ISO de hoy + 3 días (los mocks usan fechas relativas). */
function resolverFecha(valor: string): string {
  const m = /^D\+(\d+)$/.exec(valor);
  if (!m) return valor;
  const d = new Date();
  d.setDate(d.getDate() + Number(m[1]));
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const espera = <T,>(valor: T) =>
  new Promise<T>((r) => setTimeout(() => r(structuredClone(valor)), 150));

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${ruta}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Error ${res.status} en ${ruta}`);
  return (await res.json()) as T;
}

const qs = (p: Punto, extra: Record<string, string | number> = {}) =>
  "?" +
  new URLSearchParams({
    lat: String(p.lat),
    lon: String(p.lon),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  }).toString();

export function obtenerContexto(p: Punto, esc: IdEscenario): Promise<RespuestaContexto> {
  if (USAR_MOCKS) return espera(ESCENARIOS[esc].datos.contexto as RespuestaContexto);
  return pedir<ContextoV1>("/api/v1/contexto", { method: "POST", body: JSON.stringify({ latitud: p.lat, longitud: p.lon, mes_siembra: new Date().getMonth() + 1 }) }).then((r) => ({
    lugar: `Referencia a ${r.referencia.distancia_km} km`, altitud_m: r.altitud_m,
    zona: r.zona.id.replaceAll("-", "_") as RespuestaContexto["zona"], cultivos_comunes: r.catalogo_zona.map((c) => c.id),
  }));
}

interface ContextoV1 {
  altitud_m: number;
  zona: { id: string };
  referencia: { distancia_km: number };
  catalogo_zona: { id: string }[];
  recomendaciones: { cultivo_id: string; porcentaje_afinidad: number; en_rescate: boolean }[];
  avisos: { codigo: string; mensaje: string }[];
}

export async function obtenerSemana(p: Punto, esc: IdEscenario): Promise<RespuestaSemana> {
  if (!USAR_MOCKS) return pedir(`/clima/semana${qs(p)}`);
  const s = await espera(ESCENARIOS[esc].datos.semana);
  return {
    fuente: s.fuente,
    dias: s.dias.map((d) => ({ ...d, fecha: resolverFecha(d.fecha) }) as DiaClima),
  };
}

export async function obtenerAlertas(p: Punto, esc: IdEscenario): Promise<RespuestaAlertas> {
  if (!USAR_MOCKS) return pedir(`/clima/alertas${qs(p)}`);
  const a = await espera(ESCENARIOS[esc].datos.alertas);
  return {
    fuente: a.fuente,
    alertas: a.alertas.map(
      (x) => ({ ...x, desde: resolverFecha(x.desde), hasta: resolverFecha(x.hasta) }) as Alerta,
    ),
  };
}

export async function obtenerVsNormal(p: Punto, esc: IdEscenario): Promise<RespuestaVsNormal> {
  if (!USAR_MOCKS) return pedir(`/clima/vs-normal${qs(p)}`);
  const v = (await espera(ESCENARIOS[esc].datos.vsNormal)) as RespuestaVsNormal;
  return { ...v, mes: new Date().getMonth() + 1 };
}

export function obtenerElNino(p: Punto, esc: IdEscenario): Promise<RespuestaElNino> {
  if (USAR_MOCKS) return espera(ESCENARIOS[esc].datos.elNino as RespuestaElNino);
  return pedir(`/el-nino${qs(p)}`);
}

export function obtenerSemaforo(p: Punto, esc: IdEscenario, mes: number): Promise<RespuestaSemaforo> {
  if (USAR_MOCKS) return espera(ESCENARIOS[esc].datos.semaforo as RespuestaSemaforo);
  return pedir(`/siembra/semaforo${qs(p, { mes })}`);
}

export function obtenerRiego(p: Punto, esc: IdEscenario): Promise<RespuestaRiego> {
  if (USAR_MOCKS) return espera(ESCENARIOS[esc].datos.riego as RespuestaRiego);
  return pedir(`/riego${qs(p)}`);
}

export function obtenerSemillas(): Promise<RespuestaSemillas> {
  return espera(catalogo as RespuestaSemillas);
}

/**
 * En modo prueba se imita la rotación: se quita lo que no conviene sembrar
 * después del último cultivo, se premia lo que va bien después de él
 * y un poco lo que el agricultor ya tiene para sembrar.
 * El backend real hará esto con la red neuronal.
 */
export async function obtenerRecomendaciones(
  peticion: PeticionRecomendaciones,
  esc: IdEscenario,
): Promise<RespuestaRecomendaciones> {
  if (!USAR_MOCKS) {
    const respuesta = await pedir<ContextoV1>("/api/v1/contexto", { method: "POST", body: JSON.stringify({
      latitud: peticion.lat, longitud: peticion.lon, mes_siembra: peticion.mes,
      historial: peticion.historial.filter((id): id is string => id !== null).map((cultivo_id) => ({ cultivo_id })),
    }) });
    return { modelo: "red-neuronal (contexto aproximado)", avisos: respuesta.avisos.map((a) => a.mensaje), recomendaciones: respuesta.recomendaciones.map((r) => ({
      semillaId: r.cultivo_id, puntaje: r.porcentaje_afinidad / 100, en_rescate: r.en_rescate, motivos: [],
    })) };
  }

  const base = (await espera(ESCENARIOS[esc].datos.recomendaciones)) as RespuestaRecomendaciones;
  const semillas = (catalogo as RespuestaSemillas).semillas;
  const ultimo = semillas.find((s) => s.id === peticion.historial[0]);
  const ajustadas = base.recomendaciones
    .filter((r) => !ultimo || (r.semillaId !== ultimo.id && !ultimo.despues_de_mal.includes(r.semillaId)))
    .map((r) => {
      const candidata = semillas.find((s) => s.id === r.semillaId);
      const rotaBien = !!ultimo && !!candidata?.despues_de_bien.includes(ultimo.id);
      if (peticion.semillas_disponibles?.includes(r.semillaId)) r = { ...r, puntaje: Math.min(1, r.puntaje + 0.04) };
      return rotaBien
        ? {
            ...r,
            puntaje: Math.min(1, r.puntaje + 0.06),
            motivos: r.motivos.includes("rota_bien") ? r.motivos : (["rota_bien", ...r.motivos] as typeof r.motivos),
          }
        : r;
    })
    .sort((a, b) => b.puntaje - a.puntaje);
  return { modelo: base.modelo, recomendaciones: ajustadas };
}
