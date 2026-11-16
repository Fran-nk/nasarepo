/**
 * Open-Meteo (https://open-meteo.com): pronóstico gratuito, sin clave y con CORS.
 * NASA POWER no da pronóstico, así que los próximos 7 días salen de aquí.
 * También da la altura del terreno (modelo de elevación de 90 m), más precisa que la de POWER.
 */
import { pedirJson } from "./red";
import type { Punto } from "./power";

export interface RespuestaOpenMeteo {
  elevation?: number;
  daily?: {
    time?: string[];
    weather_code?: (number | null)[];
    precipitation_sum?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    temperature_2m_max?: (number | null)[];
  };
}

/** Un día de pronóstico ya limpio. */
export interface DiaPronostico {
  fecha: string;
  codigo: number; // código de tiempo de la OMM
  lluvia_mm: number;
  prob_lluvia: number; // 0–1
  tmin: number;
  tmax: number;
}

export function urlPronostico(p: Punto, dias = 7): string {
  const q = new URLSearchParams({
    latitude: p.lat.toFixed(3),
    longitude: p.lon.toFixed(3),
    daily: "weather_code,precipitation_sum,precipitation_probability_max,temperature_2m_min,temperature_2m_max",
    forecast_days: String(dias),
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Días completos del pronóstico; un día al que le falta la temperatura se descarta. */
export function diasPronostico(r: RespuestaOpenMeteo): DiaPronostico[] {
  const d = r.daily;
  if (!d?.time?.length) throw new Error("Open-Meteo no devolvió el pronóstico");
  const dias: DiaPronostico[] = [];
  d.time.forEach((fecha, i) => {
    const tmin = num(d.temperature_2m_min?.[i]);
    const tmax = num(d.temperature_2m_max?.[i]);
    if (tmin === null || tmax === null) return;
    const prob = num(d.precipitation_probability_max?.[i]);
    dias.push({
      fecha,
      codigo: num(d.weather_code?.[i]) ?? 0,
      lluvia_mm: num(d.precipitation_sum?.[i]) ?? 0,
      prob_lluvia: prob === null ? 0 : prob / 100,
      tmin,
      tmax,
    });
  });
  if (dias.length === 0) throw new Error("Open-Meteo no devolvió el pronóstico");
  return dias;
}

export function alturaTerreno(r: RespuestaOpenMeteo): number | null {
  return num(r.elevation);
}

export function pedirPronostico(p: Punto) {
  return pedirJson<RespuestaOpenMeteo>(urlPronostico(p));
}
