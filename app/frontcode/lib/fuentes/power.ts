/**
 * NASA POWER (https://power.larc.nasa.gov): datos gratuitos, sin clave y con CORS.
 * Viene del reanálisis MERRA-2 de la NASA. Se usa para:
 *  - el promedio de cada mes (climatología 2001–2025),
 *  - los últimos días medidos (lluvia, temperatura y humedad del suelo),
 *  - la temperatura del mar frente al Perú (El Niño).
 * Los días que aún no se procesaron llegan como -999 (unos 3 días de retraso).
 */
import { pedirJson } from "./red";

const BASE = "https://power.larc.nasa.gov/api/temporal";
export const SIN_DATO = -999;
const MESES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export interface RespuestaPower {
  geometry?: { coordinates?: number[] };
  properties?: { parameter?: Record<string, Record<string, number>> };
}

/** Un día medido. `fecha` en YYYY-MM-DD. */
export interface DiaMedido {
  fecha: string;
  valor: number;
}

export interface Punto {
  lat: number;
  lon: number;
}

const coord = (n: number) => n.toFixed(2);

export function urlClimatologia(p: Punto, parametros: string[]): string {
  const q = new URLSearchParams({
    parameters: parametros.join(","),
    community: "AG",
    latitude: coord(p.lat),
    longitude: coord(p.lon),
    format: "JSON",
  });
  return `${BASE}/climatology/point?${q}`;
}

/** `desde` y `hasta` en YYYY-MM-DD. */
export function urlDiario(p: Punto, parametros: string[], desde: string, hasta: string): string {
  const q = new URLSearchParams({
    parameters: parametros.join(","),
    community: "AG",
    latitude: coord(p.lat),
    longitude: coord(p.lon),
    start: desde.replaceAll("-", ""),
    end: hasta.replaceAll("-", ""),
    format: "JSON",
  });
  return `${BASE}/daily/point?${q}`;
}

const valido = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n !== SIN_DATO;

/** Los 12 promedios mensuales de un parámetro (enero = índice 0). Lanza error si falta alguno. */
export function promediosMensuales(r: RespuestaPower, parametro: string): number[] {
  const serie = r.properties?.parameter?.[parametro];
  const valores = MESES.map((m) => serie?.[m]);
  if (!valores.every(valido)) throw new Error(`NASA POWER no tiene el promedio mensual de ${parametro}`);
  return valores;
}

/** Días con dato válido de un parámetro, ordenados por fecha (se descartan los -999). */
export function diasMedidos(r: RespuestaPower, parametro: string): DiaMedido[] {
  const serie = r.properties?.parameter?.[parametro] ?? {};
  return Object.entries(serie)
    .filter(([clave, v]) => /^\d{8}$/.test(clave) && valido(v))
    .map(([clave, v]) => ({ fecha: `${clave.slice(0, 4)}-${clave.slice(4, 6)}-${clave.slice(6, 8)}`, valor: v }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Altura (m) de la celda de NASA POWER: es un promedio de un área grande, no la del terreno. */
export function alturaCelda(r: RespuestaPower): number | null {
  const z = r.geometry?.coordinates?.[2];
  return valido(z) ? z : null;
}

export function pedirClimatologia(p: Punto, parametros: string[]) {
  return pedirJson<RespuestaPower>(urlClimatologia(p, parametros));
}

export function pedirDiario(p: Punto, parametros: string[], desde: string, hasta: string) {
  return pedirJson<RespuestaPower>(urlDiario(p, parametros, desde, hasta));
}
