/**
 * Recomendación por reglas mientras la red neuronal del backend no está disponible.
 * Cruza el catálogo de semillas con el clima real del lugar (NASA POWER, ajustado a la altura del
 * terreno) durante los meses que dura el cultivo, y aplica la rotación con el historial.
 */
import type {
  MotivoRecomendacion,
  Recomendacion,
  Semilla,
} from "@/app/front/lib/contratos/tipos";

/** Clima de los 12 meses en el lugar (índice 0 = enero). */
export interface ClimaLugar {
  altitud: number;
  tempMedia: number[]; // °C, temperatura media del mes
  tempMin: number[]; // °C, la noche más fría del mes (T2M_MIN de NASA POWER)
  lluviaMes: number[]; // mm por mes
}

/** Margen de altura (m) fuera del rango de la semilla que todavía se acepta con menos puntaje. */
const MARGEN_ALTURA = 300;

/** Noche más fría que aguanta según "aguante al frío" (0–5). */
const MINIMA_TOLERADA = [10, 6, 3, 0, -3, -6];
/** Temperatura media más alta que aguanta según "aguante al calor" (0–5). */
const MEDIA_TOLERADA = [15, 18, 21, 24, 27, 30];
/** Lluvia que necesita por mes (mm) según "agua que necesita" (0–5). */
const LLUVIA_NECESARIA = [20, 30, 50, 75, 110, 150];

const promedio = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const entre = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Meses que ocupa el cultivo si se siembra en `mes` (1–12). Las perennes, todo el año. */
export function mesesDelCultivo(semilla: Pick<Semilla, "ciclo_dias" | "perenne">, mes: number): number[] {
  const n = semilla.perenne ? 12 : entre(Math.round(semilla.ciclo_dias / 30), 1, 12);
  return Array.from({ length: n }, (_, i) => ((mes - 1 + i) % 12) + 1);
}

/**
 * Puntaje de un margen en °C: con 5 °C o más de holgura vale 1; justo en el límite, 0.85;
 * pasado el límite baja hasta 0 a los 5 °C.
 */
export function puntajeMargen(margen: number): number {
  if (margen >= 0) return 0.85 + 0.15 * Math.min(1, margen / 5);
  return Math.max(0, 0.85 + 0.17 * margen);
}

/** Qué tan bien le va a una semilla en ese clima (0–1 por aspecto) y los datos usados. */
export function ajusteClima(semilla: Semilla, clima: ClimaLugar, mes: number) {
  const meses = mesesDelCultivo(semilla, mes).map((m) => m - 1);
  const minima = Math.min(...meses.map((i) => clima.tempMin[i]));
  const media = promedio(meses.map((i) => clima.tempMedia[i]));
  const lluvia = meses.reduce((s, i) => s + clima.lluviaMes[i], 0);
  const proporcionLluvia = lluvia / (LLUVIA_NECESARIA[semilla.stats.agua] * meses.length);

  const margenFrio = minima - MINIMA_TOLERADA[semilla.stats.frio];
  const margenCalor = MEDIA_TOLERADA[semilla.stats.calor] - media;
  // Con poca lluvia se puede regar: la falta de agua resta, pero no descarta.
  let agua = 0.5 + 0.5 * Math.min(1, proporcionLluvia);
  if (proporcionLluvia > 2) agua *= Math.max(0.7, 1 - (proporcionLluvia - 2) * 0.1);

  return {
    frio: puntajeMargen(margenFrio),
    calor: puntajeMargen(margenCalor),
    agua,
    margenFrio,
    margenCalor,
    minima,
    proporcionLluvia,
  };
}

/** 1 en el centro del rango de altura, 0.8 en los bordes, 0.5 hasta 300 m fuera, 0 más allá. */
export function ajusteAltura(semilla: Pick<Semilla, "altura_min_m" | "altura_max_m">, altitud: number): number {
  const { altura_min_m: min, altura_max_m: max } = semilla;
  if (altitud >= min && altitud <= max) {
    const mitad = (max - min) / 2 || 1;
    return 1 - 0.2 * Math.min(1, Math.abs(altitud - (min + mitad)) / mitad);
  }
  const fuera = altitud < min ? min - altitud : altitud - max;
  return fuera <= MARGEN_ALTURA ? 0.5 : 0;
}

/** Semillas que se siembran a esa altura (RF 6): primero las comunes. */
export function cultivosDeLaZona(semillas: Semilla[], altitud: number, maximo = 10): string[] {
  return semillas
    .filter((s) => altitud >= s.altura_min_m && altitud <= s.altura_max_m)
    .sort((a, b) => Number(a.rareza !== "comun") - Number(b.rareza !== "comun"))
    .slice(0, maximo)
    .map((s) => s.id);
}

export function recomendar(entrada: {
  semillas: Semilla[];
  clima: ClimaLugar;
  mes: number;
  historial: (string | null)[];
  disponibles?: string[];
  comunes?: string[];
  maximo?: number;
}): Recomendacion[] {
  const { semillas, clima, mes, historial, disponibles = [], comunes = [], maximo = 8 } = entrada;
  const ultimo = semillas.find((s) => s.id === historial[0]);

  const resultado: Recomendacion[] = [];
  for (const s of semillas) {
    if (ultimo && (s.id === ultimo.id || ultimo.despues_de_mal.includes(s.id))) continue;
    const altura = ajusteAltura(s, clima.altitud);
    if (altura === 0) continue;
    const a = ajusteClima(s, clima, mes);
    const ajuste = a.frio * a.calor * a.agua;
    if (ajuste < 0.25) continue;

    const rotaBien = !!ultimo && s.despues_de_bien.includes(ultimo.id);
    const esComun = comunes.includes(s.id);
    const enRescate = s.rareza === "en_rescate";

    const candidatos: [boolean, MotivoRecomendacion][] = [
      [rotaBien, "rota_bien"],
      [a.margenFrio >= 0 && a.margenCalor >= 0 && a.proporcionLluvia >= 0.8, "clima_ideal"],
      [a.minima < 0 && a.margenFrio >= 0, "aguanta_helada"],
      [a.proporcionLluvia < 0.8 && s.stats.agua <= 2, "aguanta_sequia"],
      [a.proporcionLluvia >= 1 && s.stats.agua >= 3, "aprovecha_lluvias"],
      [s.habilidades.some((h) => h.toLowerCase().includes("nitrógeno")), "fija_nitrogeno"],
      [esComun, "comun_en_zona"],
      [!s.perenne && s.ciclo_dias <= 120, "ciclo_corto"],
    ];
    const motivos = candidatos.filter(([si]) => si).map(([, m]) => m);
    // La insignia de rescate siempre se explica, aunque haya otros motivos antes.
    const visibles = enRescate ? [...motivos.slice(0, 2), "especie_en_rescate" as const] : motivos.slice(0, 3);

    const puntaje =
      0.65 * ajuste +
      0.2 * altura +
      (rotaBien ? 0.06 : 0) +
      (esComun ? 0.04 : 0) +
      (disponibles.includes(s.id) ? 0.03 : 0) +
      (enRescate ? 0.02 : 0);

    resultado.push({
      semillaId: s.id,
      puntaje: Math.round(Math.min(1, puntaje) * 100) / 100,
      motivos: visibles,
      en_rescate: enRescate,
    });
  }
  return resultado.sort((x, y) => y.puntaje - x.puntaje).slice(0, maximo);
}
