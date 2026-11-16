/**
 * Cliente de datos de las pantallas. Todo sale de fuentes públicas y gratuitas, pedidas desde el celular:
 *  - NASA POWER: clima medido, promedio de cada mes, humedad del suelo y temperatura del mar (El Niño).
 *  - Open-Meteo: pronóstico de 7 días y altura del terreno (NASA no da pronóstico).
 *  - Mapbox: nombre del lugar (el mismo servicio del mapa).
 * Las cuentas están en lib/calculos (con pruebas). Detalle de cada dato: docs/fuentes-de-datos.md
 * Las pantallas solo usan estas funciones: si el backend toma una parte, no cambian.
 */
import type {
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
  Semilla,
} from "@/app/front/lib/contratos/tipos";
import catalogo from "@/app/front/datos/semillas.json";
import {
  calcularAlertas,
  calcularSemaforo,
  calcularVsNormal,
  corregirPorAltura,
  decidirRiego,
  lluviaMensualMm,
  lluviaProximosDias,
  semanaDesdePronostico,
} from "@/app/front/lib/calculos/clima";
import {
  anomaliasDiarias,
  condicionNino,
  DIAS_CONDICION,
  efectoEnZona,
  PUNTOS_NINO_12,
  promedioPorFecha,
  resumenMar,
} from "@/app/front/lib/calculos/elNino";
import { cultivosDeLaZona, recomendar, type ClimaLugar } from "@/app/front/lib/calculos/recomendar";
import { vertiente, zonaPulgarVidal } from "@/app/front/lib/calculos/zona";
import { nombreLugar } from "@/app/front/lib/fuentes/lugar";
import { alturaTerreno, diasPronostico, pedirPronostico } from "@/app/front/lib/fuentes/openMeteo";
import {
  alturaCelda,
  diasMedidos,
  pedirClimatologia,
  pedirDiario,
  promediosMensuales,
  urlDiario,
  type Punto,
} from "@/app/front/lib/fuentes/power";

export type { Punto };

const FUENTE_POWER = "NASA POWER (reanálisis MERRA-2)";
const FUENTE_PRONOSTICO = "Pronóstico Open-Meteo";
export const AVISO_OFICIAL_ENFEN = "https://enfen.imarpe.gob.pe/";
export const PAGINA_NASA_POWER = "https://power.larc.nasa.gov/data-access-viewer/";

const SEMILLAS = (catalogo as RespuestaSemillas).semillas as Semilla[];

/** Fecha local de hoy ± días, en YYYY-MM-DD. */
export function fechaRelativa(dias: number, hoy = new Date()): string {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------- Pedidos base (se comparten entre tarjetas) ---------- */

async function pronostico(p: Punto) {
  const r = await pedirPronostico(p);
  return { dias: diasPronostico(r), altura: alturaTerreno(r) };
}

async function promedios(p: Punto) {
  const r = await pedirClimatologia(p, ["T2M", "T2M_MIN", "PRECTOTCORR", "GWETROOT"]);
  return {
    temp: promediosMensuales(r, "T2M"),
    tmin: promediosMensuales(r, "T2M_MIN"), // la noche más fría de cada mes
    lluviaDia: promediosMensuales(r, "PRECTOTCORR"),
    humedad: promediosMensuales(r, "GWETROOT"),
    alturaCelda: alturaCelda(r),
  };
}

/** Últimos ~45 días medidos: alcanza para el mes en curso o, a inicio de mes, el anterior completo. */
async function medidos(p: Punto) {
  const r = await pedirDiario(p, ["T2M", "PRECTOTCORR", "GWETROOT"], fechaRelativa(-45), fechaRelativa(0));
  return {
    temp: diasMedidos(r, "T2M"),
    lluvia: diasMedidos(r, "PRECTOTCORR"),
    humedad: diasMedidos(r, "GWETROOT"),
    alturaCelda: alturaCelda(r),
  };
}

async function humedadActual(p: Punto) {
  const ultimo = (await medidos(p)).humedad.at(-1);
  if (!ultimo) throw new Error("NASA POWER no tiene la humedad del suelo de los últimos días");
  return ultimo;
}

/** Altura del terreno (Open-Meteo, 90 m); si no responde, la de la celda de NASA POWER. */
async function lugar(p: Punto) {
  const [pron, prom] = await Promise.allSettled([pronostico(p), promedios(p)]);
  const altura =
    (pron.status === "fulfilled" ? pron.value.altura : null) ??
    (prom.status === "fulfilled" ? prom.value.alturaCelda : null);
  if (altura === null) throw new Error("No se pudo saber la altura del terreno");
  return { altitud: altura, zona: zonaPulgarVidal(altura, p.lat, p.lon), vertiente: vertiente(p.lat, p.lon) };
}

/* ---------- Lo que piden las pantallas ---------- */

export async function obtenerContexto(p: Punto): Promise<RespuestaContexto> {
  const [{ altitud, zona }, nombre] = await Promise.all([lugar(p), nombreLugar(p)]);
  return {
    lugar: nombre,
    altitud_m: Math.round(altitud),
    zona,
    cultivos_comunes: cultivosDeLaZona(SEMILLAS, altitud),
    fuente: "Altura: modelo de terreno de Open-Meteo · Zona: regiones de Pulgar Vidal · Lugar: Mapbox",
  };
}

export async function obtenerSemana(p: Punto): Promise<RespuestaSemana> {
  const { dias } = await pronostico(p);
  return { dias: semanaDesdePronostico(dias), fuente: FUENTE_PRONOSTICO };
}

export async function obtenerAlertas(p: Punto): Promise<RespuestaAlertas> {
  const mes = new Date().getMonth();
  const [{ dias }, humedad, prom] = await Promise.all([
    pronostico(p),
    humedadActual(p).catch(() => null),
    promedios(p).catch(() => null),
  ]);
  const suelo = humedad && prom ? { actual: humedad.valor, normal: prom.humedad[mes] } : undefined;
  return {
    alertas: calcularAlertas(dias, suelo),
    fuente: suelo ? `${FUENTE_PRONOSTICO} + humedad del suelo de ${FUENTE_POWER}` : FUENTE_PRONOSTICO,
  };
}

export async function obtenerVsNormal(p: Punto): Promise<RespuestaVsNormal> {
  const [m, prom, sitio] = await Promise.all([medidos(p), promedios(p), lugar(p).catch(() => null)]);
  const correccion = sitio ? corregirPorAltura(0, m.alturaCelda ?? prom.alturaCelda, sitio.altitud) : 0;
  return {
    ...calcularVsNormal({
      lluvia: m.lluvia,
      temperatura: m.temp,
      lluviaNormalDia: prom.lluviaDia,
      tempNormal: prom.temp,
      correccionTemp: correccion,
    }),
    fuente: `${FUENTE_POWER}: días medidos y promedio 2001–2025`,
  };
}

/** Temperatura del mar en la zona Niño 1+2 (4 puntos), comparada con su promedio de cada mes. */
async function anomaliaMar() {
  const desde = fechaRelativa(-(DIAS_CONDICION + 10));
  const hasta = fechaRelativa(0);
  const series = await Promise.allSettled(
    PUNTOS_NINO_12.map(async (punto) => {
      const [diario, clima] = await Promise.all([
        pedirDiario(punto, ["TS"], desde, hasta),
        pedirClimatologia(punto, ["TS"]),
      ]);
      const medido = diasMedidos(diario, "TS");
      return { medido, anomalias: anomaliasDiarias(medido, promediosMensuales(clima, "TS")) };
    }),
  );
  const buenas = series.flatMap((s) => (s.status === "fulfilled" && s.value.medido.length ? [s.value] : []));
  if (buenas.length === 0) throw new Error("NASA POWER no respondió con la temperatura del mar");
  return {
    medido: promedioPorFecha(buenas.map((b) => b.medido)),
    anomalias: promedioPorFecha(buenas.map((b) => b.anomalias)),
    datosUrl: urlDiario(PUNTOS_NINO_12[1], ["TS"], desde, hasta),
  };
}

export async function obtenerElNino(p: Punto): Promise<RespuestaElNino> {
  const [mar, sitio] = await Promise.all([anomaliaMar(), lugar(p).catch(() => null)]);
  const c = condicionNino(mar.anomalias);
  return {
    ...c,
    ...resumenMar(mar.medido, mar.anomalias),
    serie: mar.anomalias.map((d) => ({ fecha: d.fecha, anomalia_c: Math.round(d.valor * 100) / 100 })),
    puntos: [...PUNTOS_NINO_12],
    datos_url: mar.datosUrl,
    fuente_url: PAGINA_NASA_POWER,
    efecto_zona: sitio
      ? efectoEnZona({ estado: c.estado, fenomeno: c.fenomeno, zona: sitio.zona, lat: p.lat, vertiente: sitio.vertiente })
      : "sin_efecto_claro",
    fuente: `${FUENTE_POWER}: temperatura del mar en la zona Niño 1+2 (estimación, no es el aviso oficial)`,
    aviso_oficial_url: AVISO_OFICIAL_ENFEN,
  };
}

export async function obtenerSemaforo(p: Punto, mes: number): Promise<RespuestaSemaforo> {
  const [{ dias }, prom, humedad, sitio] = await Promise.all([pronostico(p), promedios(p), humedadActual(p), lugar(p)]);
  return {
    ...calcularSemaforo({
      dias,
      humedad: humedad.valor,
      lluviaNormalMm: lluviaMensualMm(prom.lluviaDia),
      mes,
      zona: sitio.zona,
    }),
    fuente: `Reglas con ${FUENTE_PRONOSTICO} y ${FUENTE_POWER}`,
  };
}

export async function obtenerRiego(p: Punto): Promise<RespuestaRiego> {
  const [{ dias }, humedad] = await Promise.all([pronostico(p), humedadActual(p)]);
  const lluvia3 = lluviaProximosDias(dias, 3);
  return {
    regar: decidirRiego(humedad.valor, lluvia3),
    humedad_suelo: humedad.valor,
    humedad_fecha: humedad.fecha,
    lluvia_3dias_mm: lluvia3,
    fuente: `Humedad del suelo: ${FUENTE_POWER} · lluvia: ${FUENTE_PRONOSTICO}`,
  };
}

/** Catálogo curado por el equipo (no viene de una API). */
export async function obtenerSemillas(): Promise<RespuestaSemillas> {
  return { semillas: SEMILLAS };
}

/**
 * Mientras la red neuronal del backend no esté lista (/api/v1/salud → modelo_disponible: false),
 * se recomienda con reglas: clima real del lugar durante los meses del cultivo + rotación.
 */
export async function obtenerRecomendaciones(peticion: PeticionRecomendaciones): Promise<RespuestaRecomendaciones> {
  const p = { lat: peticion.lat, lon: peticion.lon };
  const [prom, sitio] = await Promise.all([promedios(p), lugar(p)]);
  const ajuste = (t: number) => corregirPorAltura(t, prom.alturaCelda, sitio.altitud);
  const clima: ClimaLugar = {
    altitud: sitio.altitud,
    tempMedia: prom.temp.map(ajuste),
    tempMin: prom.tmin.map(ajuste),
    lluviaMes: lluviaMensualMm(prom.lluviaDia),
  };
  return {
    modelo: "reglas con NASA POWER",
    recomendaciones: recomendar({
      semillas: SEMILLAS,
      clima,
      mes: peticion.mes,
      historial: peticion.historial,
      disponibles: peticion.semillas_disponibles,
      comunes: cultivosDeLaZona(SEMILLAS, sitio.altitud),
    }),
  };
}
