/**
 * Reglas que convierten datos medidos (NASA POWER) y pronosticados (Open-Meteo) en lo que
 * muestran las tarjetas: cielo de cada día, alertas, riego, semáforo de siembra y "vs. lo normal".
 * Funciones puras: se prueban sin red (calculos/clima.test.ts).
 */
import type {
  Alerta,
  Cielo,
  DiaClima,
  RespuestaSemaforo,
  RespuestaVsNormal,
  TipoAlerta,
  ZonaPulgarVidal,
} from "@/app/frontcode/lib/contratos/tipos";
import type { DiaPronostico } from "@/app/frontcode/lib/fuentes/openMeteo";
import type { DiaMedido } from "@/app/frontcode/lib/fuentes/power";

/** La temperatura baja unos 6.5 °C por cada 1,000 m que se sube. */
export const GRADIENTE_C_POR_M = 0.0065;
/**
 * Tope del ajuste. La celda mezcla valle y cerro: en Piura está a 1,050 m y la ciudad a 90 m,
 * y el ajuste completo (+6 °C) daría una costa más caliente de lo que es.
 */
export const CORRECCION_MAX_C = 5;

/**
 * NASA POWER da la temperatura media de una celda de ~50 km, con su propia altura.
 * Se ajusta a la altura real del terreno: en Cusco la celda está a 3,740 m y la ciudad a 3,350 m.
 */
export function corregirPorAltura(temp: number, alturaCelda: number | null, alturaTerreno: number | null): number {
  if (alturaCelda === null || alturaTerreno === null) return temp;
  const ajuste = GRADIENTE_C_POR_M * (alturaCelda - alturaTerreno);
  return temp + Math.max(-CORRECCION_MAX_C, Math.min(CORRECCION_MAX_C, ajuste));
}

const redondear = (n: number, decimales = 0) => {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
};

const DIAS_DEL_MES = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();
const mesDe = (fechaIso: string) => Number(fechaIso.slice(5, 7));
const anioDe = (fechaIso: string) => Number(fechaIso.slice(0, 4));

/* ---------- Cielo y semana ---------- */

/** Código de tiempo de la OMM (Open-Meteo) + lluvia del día → dibujo sencillo. */
export function cieloDelDia(codigo: number, lluviaMm: number): Cielo {
  if (codigo >= 95 || lluviaMm >= 15) return "tormenta";
  if (lluviaMm >= 1) return "lluvia";
  if (codigo >= 2) return "nubes";
  return "sol";
}

export function semanaDesdePronostico(dias: DiaPronostico[]): DiaClima[] {
  return dias.slice(0, 7).map((d) => ({
    fecha: d.fecha,
    cielo: cieloDelDia(d.codigo, d.lluvia_mm),
    lluvia_mm: redondear(d.lluvia_mm, 1),
    prob_lluvia: redondear(d.prob_lluvia, 2),
    tmin: Math.round(d.tmin),
    tmax: Math.round(d.tmax),
  }));
}

export function lluviaProximosDias(dias: DiaPronostico[], cuantos: number): number {
  return redondear(
    dias.slice(0, cuantos).reduce((s, d) => s + d.lluvia_mm, 0),
    1,
  );
}

/* ---------- Alertas ---------- */

/** Umbrales (°C y mm por día). Mismos valores en la documentación de fuentes. */
export const UMBRALES = {
  helada: { atencion: 0, peligro: -3 }, // temperatura mínima ≤
  calor: { atencion: 36, peligro: 38 }, // temperatura máxima ≥ (en la selva 34–35 °C es lo normal)
  lluvia: { atencion: 20, peligro: 40 }, // lluvia del día ≥
  sequia: { atencion: 0.15, peligro: 0.25 }, // humedad del suelo por debajo de lo normal en…
} as const;

type Nivel = Alerta["nivel"];

function nivelDelDia(tipo: TipoAlerta, d: DiaPronostico): Nivel | null {
  switch (tipo) {
    case "helada":
      return d.tmin <= UMBRALES.helada.peligro ? "peligro" : d.tmin <= UMBRALES.helada.atencion ? "atencion" : null;
    case "calor":
      return d.tmax >= UMBRALES.calor.peligro ? "peligro" : d.tmax >= UMBRALES.calor.atencion ? "atencion" : null;
    case "lluvia_fuerte":
      return d.lluvia_mm >= UMBRALES.lluvia.peligro ? "peligro" : d.lluvia_mm >= UMBRALES.lluvia.atencion ? "atencion" : null;
    // 96 y 99: tormenta con granizo según el pronóstico. No se adivina granizo por otras señales.
    case "granizo":
      return d.codigo === 96 || d.codigo === 99 ? "atencion" : null;
    default:
      return null;
  }
}

/** Junta los días seguidos con la misma alerta; el nivel es el peor de esos días. */
function agrupar(tipo: TipoAlerta, dias: DiaPronostico[]): Alerta[] {
  const alertas: Alerta[] = [];
  let actual: Alerta | null = null;
  for (const d of dias) {
    const nivel = nivelDelDia(tipo, d);
    if (!nivel) {
      actual = null;
      continue;
    }
    if (actual) {
      actual.hasta = d.fecha;
      if (nivel === "peligro") actual.nivel = "peligro";
    } else {
      actual = { tipo, nivel, desde: d.fecha, hasta: d.fecha };
      alertas.push(actual);
    }
  }
  return alertas;
}

export interface HumedadSuelo {
  actual: number; // 0–1, último día medido
  normal: number; // 0–1, promedio de este mes
}

/**
 * Alertas de los próximos días. Huaico no se calcula: depende de la pendiente y del cauce,
 * que estos datos no tienen.
 */
export function calcularAlertas(dias: DiaPronostico[], humedad?: HumedadSuelo): Alerta[] {
  const alertas = (["helada", "granizo", "lluvia_fuerte", "calor"] as const).flatMap((t) => agrupar(t, dias));
  if (humedad && dias.length > 0) {
    const falta = humedad.normal - humedad.actual;
    const lluviaSemana = lluviaProximosDias(dias, 7);
    if (lluviaSemana < 5 && falta >= UMBRALES.sequia.atencion) {
      alertas.push({
        tipo: "sequia",
        nivel: falta >= UMBRALES.sequia.peligro ? "peligro" : "atencion",
        desde: dias[0].fecha,
        hasta: dias[Math.min(6, dias.length - 1)].fecha,
      });
    }
  }
  return alertas.sort((a, b) => a.desde.localeCompare(b.desde));
}

/* ---------- Riego ---------- */

export function decidirRiego(humedad: number, lluvia3dias: number): "si" | "poco" | "no" {
  if (lluvia3dias >= 10 || humedad >= 0.65) return "no";
  if (lluvia3dias >= 4 || humedad >= 0.45) return "poco";
  return "si";
}

/* ---------- Semáforo de siembra ---------- */

const SIERRA_DE_SECANO: ZonaPulgarVidal[] = ["quechua", "suni", "puna"];

/**
 * ¿Es buen momento para sembrar? Primero los peligros de la semana (helada fuerte, lluvia excesiva,
 * calor extremo); luego la temporada (en la sierra se siembra con las lluvias); luego la humedad.
 * Usa los mismos umbrales que las alertas: si hay una alerta en la semana, nunca da verde.
 * `lluviaNormalMm[i]` es la lluvia normal del mes i+1 en mm por mes.
 */
export function calcularSemaforo(entrada: {
  dias: DiaPronostico[];
  humedad: number;
  lluviaNormalMm: number[];
  mes: number;
  zona: ZonaPulgarVidal;
}): Omit<RespuestaSemaforo, "fuente"> {
  const { dias, humedad, lluviaNormalMm, mes, zona } = entrada;
  const tmin = Math.min(...dias.map((d) => d.tmin));
  const tmax = Math.max(...dias.map((d) => d.tmax));
  const lluviaMax = Math.max(...dias.map((d) => d.lluvia_mm));
  const lluviaSemana = lluviaProximosDias(dias, 7);

  if (tmin <= UMBRALES.helada.peligro) return { color: "rojo", motivo: "riesgo_helada" };
  if (lluviaMax >= UMBRALES.lluvia.peligro || lluviaSemana >= 120) return { color: "rojo", motivo: "lluvia_excesiva" };
  if (tmax >= UMBRALES.calor.peligro) return { color: "rojo", motivo: "mucho_calor" };

  const esteMes = lluviaNormalMm[mes - 1];
  const siguiente = lluviaNormalMm[mes % 12];
  if (SIERRA_DE_SECANO.includes(zona) && esteMes < 20 && siguiente < 20)
    return { color: "amarillo", motivo: "fuera_de_temporada" };

  if (tmin <= UMBRALES.helada.atencion) return { color: "amarillo", motivo: "riesgo_helada" };
  if (lluviaMax >= UMBRALES.lluvia.atencion) return { color: "amarillo", motivo: "lluvia_excesiva" };
  if (lluviaSemana < 5 && humedad < 0.35) return { color: "amarillo", motivo: "poca_lluvia" };
  if (tmax >= UMBRALES.calor.atencion) return { color: "amarillo", motivo: "mucho_calor" };
  return { color: "verde", motivo: "buena_lluvia" };
}

/* ---------- Este año vs. lo normal ---------- */

/**
 * Compara la lluvia y la temperatura medidas con el promedio del mismo mes.
 * Se usa el mes del último día medido si ya tiene 7 días o más; si no, el mes anterior completo.
 * Lo normal se calcula solo para los días que tienen dato (si hay 12 días medidos, se compara
 * contra 12 días normales, no contra el mes entero).
 * `lluviaNormalDia[i]` está en mm por día (así lo da NASA POWER), `tempNormal[i]` en °C.
 */
export function calcularVsNormal(entrada: {
  lluvia: DiaMedido[];
  temperatura: DiaMedido[];
  lluviaNormalDia: number[];
  tempNormal: number[];
  correccionTemp?: number;
}): Omit<RespuestaVsNormal, "fuente"> {
  const { lluvia, temperatura, lluviaNormalDia, tempNormal, correccionTemp = 0 } = entrada;
  const ultimo = lluvia.at(-1);
  if (!ultimo) throw new Error("No hay días medidos para comparar");

  let anio = anioDe(ultimo.fecha);
  let mes = mesDe(ultimo.fecha);
  if (Number(ultimo.fecha.slice(8, 10)) < 7) {
    mes -= 1;
    if (mes === 0) {
      mes = 12;
      anio -= 1;
    }
  }
  const prefijo = `${anio}-${String(mes).padStart(2, "0")}`;
  const delMes = lluvia.filter((d) => d.fecha.startsWith(prefijo));
  const tempsDelMes = temperatura.filter((d) => d.fecha.startsWith(prefijo));
  if (delMes.length === 0) throw new Error("No hay días medidos en el mes a comparar");

  const lluviaMm = delMes.reduce((s, d) => s + d.valor, 0);
  const lluviaNormal = lluviaNormalDia[mes - 1] * delMes.length;
  const tempMedia = tempsDelMes.length
    ? tempsDelMes.reduce((s, d) => s + d.valor, 0) / tempsDelMes.length + correccionTemp
    : tempNormal[mes - 1] + correccionTemp;
  const tempNormalMes = tempNormal[mes - 1] + correccionTemp;

  return {
    mes,
    desde: delMes[0].fecha,
    hasta: delMes.at(-1)!.fecha,
    lluvia_mm: redondear(lluviaMm),
    lluvia_normal_mm: redondear(lluviaNormal),
    temp_media: redondear(tempMedia, 1),
    temp_normal: redondear(tempNormalMes, 1),
    lluvia: categoriaLluvia(lluviaMm, lluviaNormal),
    temperatura: categoriaTemperatura(tempMedia - tempNormalMes),
  };
}

/**
 * En meses secos (lo normal es casi nada) una diferencia de pocos mm no cuenta:
 * se exige una diferencia de al menos 10 mm además del porcentaje.
 */
export function categoriaLluvia(medida: number, normal: number): RespuestaVsNormal["lluvia"] {
  if (Math.abs(medida - normal) < 10) return "normal";
  if (medida < normal * 0.7) return "mas_seco";
  if (medida > normal * 1.3) return "mas_lluvioso";
  return "normal";
}

export function categoriaTemperatura(diferencia: number): RespuestaVsNormal["temperatura"] {
  if (diferencia >= 1) return "mas_calido";
  if (diferencia <= -1) return "mas_frio";
  return "normal";
}

/** mm/día → mm/mes para cada uno de los 12 meses (año sin bisiesto). */
export function lluviaMensualMm(lluviaNormalDia: number[]): number[] {
  return lluviaNormalDia.map((mmDia, i) => redondear(mmDia * DIAS_DEL_MES(2025, i + 1), 1));
}
