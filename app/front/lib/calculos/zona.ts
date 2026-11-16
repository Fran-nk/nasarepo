/**
 * Región natural de Pulgar Vidal a partir de la altura del terreno y del lado de los Andes.
 * Debajo de 2,300 m la altura sola no alcanza: Chala y Omagua están ambas abajo, pero una mira
 * al Pacífico y la otra a la Amazonía. Para eso se usa una línea aproximada de la divisoria
 * de aguas (cumbres de los Andes peruanos), suficiente para separar costa de selva.
 */
import type { ZonaPulgarVidal } from "@/app/front/lib/contratos/tipos";

/** [latitud, longitud] aproximadas de la divisoria continental, de norte a sur. */
const DIVISORIA: readonly [number, number][] = [
  [-3.5, -79.9],
  [-5.0, -79.5],
  [-6.5, -78.6],
  [-8.0, -78.2],
  [-9.5, -77.35],
  [-11.0, -76.5],
  [-12.0, -76.2],
  [-13.0, -75.4],
  [-14.0, -74.2],
  [-15.0, -72.4],
  [-16.0, -71.2],
  [-17.0, -70.5],
  [-18.5, -69.6],
];

/** Longitud de la divisoria a esa latitud (interpolada; fuera del rango se usa el extremo). */
export function longitudDivisoria(lat: number): number {
  if (lat >= DIVISORIA[0][0]) return DIVISORIA[0][1];
  for (let i = 1; i < DIVISORIA.length; i++) {
    const [latA, lonA] = DIVISORIA[i - 1];
    const [latB, lonB] = DIVISORIA[i];
    if (lat >= latB) return lonA + ((lat - latA) / (latB - latA)) * (lonB - lonA);
  }
  return DIVISORIA[DIVISORIA.length - 1][1];
}

export type Vertiente = "pacifico" | "amazonia";

export function vertiente(lat: number, lon: number): Vertiente {
  return lon < longitudDivisoria(lat) ? "pacifico" : "amazonia";
}

export function zonaPulgarVidal(altitud: number, lat: number, lon: number): ZonaPulgarVidal {
  if (altitud >= 4800) return "janca";
  if (altitud >= 4000) return "puna";
  if (altitud >= 3500) return "suni";
  if (altitud >= 2300) return "quechua";
  if (vertiente(lat, lon) === "pacifico") return altitud >= 500 ? "yunga_maritima" : "chala";
  if (altitud >= 1000) return "yunga_fluvial";
  if (altitud >= 400) return "rupa_rupa";
  return "omagua";
}
