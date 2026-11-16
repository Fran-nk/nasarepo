/**
 * El Niño costero estimado con la temperatura del mar de NASA POWER (parámetro TS, que sobre el
 * mar es la temperatura de la superficie) en la zona Niño 1+2, frente a la costa norte del Perú.
 *
 * Es una estimación, no el aviso oficial: el estado oficial lo declara el ENFEN.
 * Se usan umbrales tipo ICEN (el índice costero del ENFEN, promedio de 3 meses), según la clasificación
 * ENFEN 2012; falta confirmarlos contra la nota técnica oficial:
 *   cálido  ≥ 0.4 débil · ≥ 1.0 moderado · ≥ 1.7 fuerte · ≥ 3.0 extraordinario
 *   frío    ≤ -1.0 débil · ≤ -1.2 moderado · ≤ -1.4 fuerte
 * Comprobado con datos pasados: noviembre 2022 (La Niña) da ≈ -1.2 °C y junio 2023 (El Niño costero) ≈ +3.2 °C.
 */
import type { EfectoZonaNino, RespuestaElNino, ZonaPulgarVidal } from "@/app/frontcode/lib/contratos/tipos";
import type { DiaMedido, Punto } from "@/app/frontcode/lib/fuentes/power";
import type { Vertiente } from "./zona";

/** Cuatro puntos dentro de la caja Niño 1+2 (0°–10° S, 90°–80° O). */
export const PUNTOS_NINO_12: readonly Punto[] = [
  { lat: -2, lon: -82 },
  { lat: -5, lon: -85 },
  { lat: -8, lon: -82 },
  { lat: -5, lon: -89 },
];

export const DIAS_CONDICION = 90; // ~3 meses, como el ICEN
export const DIAS_RECIENTES = 30;

/** Diferencia de cada día con el promedio de su mes. `normal[i]` = mes i+1. */
export function anomaliasDiarias(dias: DiaMedido[], normal: number[]): DiaMedido[] {
  return dias.map((d) => ({ fecha: d.fecha, valor: d.valor - normal[Number(d.fecha.slice(5, 7)) - 1] }));
}

/** Promedio por fecha de varias series (con los puntos que tengan dato ese día). */
export function promedioPorFecha(series: DiaMedido[][]): DiaMedido[] {
  const suma = new Map<string, { total: number; n: number }>();
  for (const serie of series)
    for (const d of serie) {
      const s = suma.get(d.fecha) ?? { total: 0, n: 0 };
      s.total += d.valor;
      s.n += 1;
      suma.set(d.fecha, s);
    }
  return [...suma.entries()]
    .map(([fecha, s]) => ({ fecha, valor: s.total / s.n }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function promedioUltimos(serie: DiaMedido[], dias: number): number {
  const ultimo = serie.at(-1)!;
  const limite = new Date(`${ultimo.fecha}T12:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - (dias - 1));
  const desde = limite.toISOString().slice(0, 10);
  const ventana = serie.filter((d) => d.fecha >= desde);
  return ventana.reduce((s, d) => s + d.valor, 0) / ventana.length;
}

type Magnitud = NonNullable<RespuestaElNino["magnitud"]>;

export function magnitudCalida(a: number): Magnitud | null {
  if (a >= 3) return "extraordinaria";
  if (a >= 1.7) return "fuerte";
  if (a >= 1) return "moderada";
  if (a >= 0.4) return "debil";
  return null;
}

export function magnitudFria(a: number): Magnitud | null {
  if (a <= -1.4) return "fuerte";
  if (a <= -1.2) return "moderada";
  if (a <= -1) return "debil";
  return null;
}

const magnitud = (a: number) => magnitudCalida(a) ?? magnitudFria(a);
const fenomenoDe = (a: number): RespuestaElNino["fenomeno"] => (a < 0 ? "nina_costera" : "nino_costero");
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * alerta: el promedio de 3 meses ya pasa el umbral (condición establecida).
 * vigilancia: solo el último mes lo pasa (puede estar empezando).
 */
export function condicionNino(
  anomalias: DiaMedido[],
): Pick<RespuestaElNino, "estado" | "fenomeno" | "magnitud" | "anomalia_c" | "anomalia_30d_c" | "hasta"> {
  if (anomalias.length === 0) throw new Error("No hay datos del mar para estimar El Niño");
  const tresMeses = promedioUltimos(anomalias, DIAS_CONDICION);
  const unMes = promedioUltimos(anomalias, DIAS_RECIENTES);
  const base = { anomalia_c: r2(tresMeses), anomalia_30d_c: r2(unMes), hasta: anomalias.at(-1)!.fecha };

  const m3 = magnitud(tresMeses);
  if (m3) return { ...base, estado: "alerta", fenomeno: fenomenoDe(tresMeses), magnitud: m3 };
  if (magnitud(unMes)) return { ...base, estado: "vigilancia", fenomeno: fenomenoDe(unMes) };
  return { ...base, estado: "no_activo", fenomeno: "nino_costero" };
}

/**
 * Temperatura real del mar (promedio del último mes) y lo normal para esos días,
 * a partir de la serie medida y la de diferencias con lo normal.
 */
export function resumenMar(medido: DiaMedido[], anomalias: DiaMedido[]) {
  if (medido.length === 0 || anomalias.length === 0) throw new Error("No hay datos del mar");
  const mar = promedioUltimos(medido, DIAS_RECIENTES);
  const diferencia = promedioUltimos(anomalias, DIAS_RECIENTES);
  return { mar_c: Math.round(mar * 10) / 10, mar_normal_c: Math.round((mar - diferencia) * 10) / 10 };
}

/**
 * Efecto en la zona del agricultor. Solo se afirma lo que El Niño COSTERO trae de forma clara:
 * mar caliente → costa norte con más lluvia, y resto de la costa con más calor.
 * Para la sierra y la selva el efecto depende de otras cosas (por ejemplo, El Niño del Pacífico
 * central), así que no se adivina: "sin efecto claro". Lo que pasa de verdad en la chacra
 * lo dicen las otras tarjetas, que usan lluvia medida y pronosticada.
 */
export function efectoEnZona(entrada: {
  estado: RespuestaElNino["estado"];
  fenomeno: RespuestaElNino["fenomeno"];
  zona: ZonaPulgarVidal;
  lat: number;
  vertiente: Vertiente;
}): EfectoZonaNino {
  const { estado, fenomeno, zona, lat, vertiente } = entrada;
  if (estado === "no_activo" || fenomeno !== "nino_costero") return "sin_efecto_claro";
  const costa = vertiente === "pacifico" && (zona === "chala" || zona === "yunga_maritima");
  if (!costa) return "sin_efecto_claro";
  return lat >= -8.5 ? "mas_lluvia" : "mas_calor";
}
