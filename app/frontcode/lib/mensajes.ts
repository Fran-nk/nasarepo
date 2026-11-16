/** Convierte los datos del backend en frases sencillas para el agricultor. */
import type {
  DiaClima,
  RespuestaRiego,
  RespuestaVsNormal,
} from "@/app/frontcode/lib/contratos/tipos";

const fmtDia = new Intl.DateTimeFormat("es-PE", { weekday: "long", timeZone: "UTC" });
const fmtFecha = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", timeZone: "UTC" });
const fmtMes = new Intl.DateTimeFormat("es-PE", { month: "long", timeZone: "UTC" });

/** "2026-11-17" → "martes" (o "hoy"/"mañana" si corresponde). */
export function nombreDia(fechaIso: string, hoyIso = hoyISO()): string {
  const diff = diasEntre(hoyIso, fechaIso);
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  return fmtDia.format(new Date(`${fechaIso}T12:00:00Z`));
}

/** Para usar en una frase: "hoy", "mañana" o "el martes". */
export function cuandoDia(fechaIso: string, hoyIso = hoyISO()): string {
  const d = nombreDia(fechaIso, hoyIso);
  return d === "hoy" || d === "mañana" ? d : `el ${d}`;
}

export function fechaCorta(fechaIso: string): string {
  return fmtFecha.format(new Date(`${fechaIso}T12:00:00Z`));
}

export function nombreMes(mes: number): string {
  return fmtMes.format(new Date(Date.UTC(2026, mes - 1, 15))).toLowerCase();
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

const llueve = (d: DiaClima) => d.cielo === "lluvia" || d.cielo === "tormenta";

/** "Lloverá 3 días esta semana. El jueves, fuerte." */
export function fraseSemana(dias: DiaClima[], hoyIso = hoyISO()): string {
  const conLluvia = dias.filter(llueve);
  if (conLluvia.length === 0) return "No se espera lluvia esta semana.";
  const fuerte = dias.find((d) => d.cielo === "tormenta");
  const cuantos = conLluvia.length === 1 ? "1 día" : `${conLluvia.length} días`;
  let frase = `Lloverá ${cuantos} esta semana.`;
  if (fuerte) frase += ` ${capitalizar(cuandoDia(fuerte.fecha, hoyIso))} lloverá fuerte.`;
  return frase;
}

/** Frase de "por qué" del riego, usando la humedad y la próxima lluvia. */
export function fraseRiego(r: RespuestaRiego, dias: DiaClima[] | undefined, hoyIso = hoyISO()): string {
  const tierra =
    r.humedad_suelo >= 0.6
      ? "La tierra está mojada"
      : r.humedad_suelo >= 0.3
        ? "La tierra tiene algo de humedad"
        : "La tierra está seca";
  const proxima = dias?.find(llueve);
  if (proxima) return `${tierra} y lloverá ${cuandoDia(proxima.fecha, hoyIso)}.`;
  return `${tierra} y no se espera lluvia pronto.`;
}

/** "Este mes está más seco que otros años." */
export function fraseVsNormal(v: RespuestaVsNormal): string {
  const lluvia = {
    mas_seco: "más seco",
    normal: "parecido",
    mas_lluvioso: "más lluvioso",
  }[v.lluvia];
  const temp = {
    mas_frio: " y más frío",
    normal: "",
    mas_calido: " y más caluroso",
  }[v.temperatura];
  if (v.lluvia === "normal" && v.temperatura === "normal")
    return "Este mes está igual que otros años.";
  return `Este mes está ${lluvia}${temp} que otros años.`;
}

export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Rango de fechas legible: "hoy", "el martes", "desde hoy hasta el jueves". */
export function rangoDias(desde: string, hasta: string, hoyIso = hoyISO()): string {
  if (desde === hasta) return cuandoDia(desde, hoyIso);
  return `desde ${cuandoDia(desde, hoyIso)} hasta ${cuandoDia(hasta, hoyIso)}`;
}

export function formatoMiles(n: number): string {
  return new Intl.NumberFormat("es-PE").format(Math.round(n));
}
