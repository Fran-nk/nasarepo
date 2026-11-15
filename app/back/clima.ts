type Serie = Record<string, number>;
type Power = { properties?: { parameter?: Record<string, Serie> } };
type Pronostico = { daily?: { time: string[]; precipitation_sum: (number | null)[]; precipitation_probability_max: (number | null)[]; temperature_2m_min: (number | null)[]; temperature_2m_max: (number | null)[] } };

async function obtener<T>(url: URL): Promise<T> {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
  if (!respuesta.ok) throw new Error("Fuente externa no disponible");
  return respuesta.json() as Promise<T>;
}

export async function obtenerClima(latitud: number, longitud: number, dias: number) {
  const power = new URL("https://power.larc.nasa.gov/api/temporal/climatology/point");
  power.search = new URLSearchParams({ parameters: "T2M,PRECTOTCORR,GWETROOT", community: "AG", longitude: String(longitud), latitude: String(latitud), format: "JSON", start: "2002", end: "2025" }).toString();
  const meteo = new URL("https://api.open-meteo.com/v1/forecast");
  meteo.search = new URLSearchParams({ latitude: String(latitud), longitude: String(longitud), daily: "precipitation_sum,precipitation_probability_max,temperature_2m_min,temperature_2m_max", forecast_days: String(dias), timezone: "America/Lima" }).toString();
  const [historico, pronostico] = await Promise.allSettled([obtener<Power>(power), obtener<Pronostico>(meteo)]);
  let historicoMensual = null;
  if (historico.status === "fulfilled") {
    const datos = historico.value.properties?.parameter;
    const claves = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const valor = (parametro: string, mes: string) => {
      const n = datos?.[parametro]?.[mes];
      return typeof n === "number" && Number.isFinite(n) && n !== -999 ? n : null;
    };
    const meses = claves.map((clave, i) => {
      const lluvia = valor("PRECTOTCORR", clave);
      const humedad = valor("GWETROOT", clave);
      // POWER informa precipitación en mm/día; se expresa como total mensual medio.
      const diasMes = new Date(Date.UTC(2023, i + 1, 0)).getUTCDate();
      return { mes: i + 1, lluvia_mm: lluvia === null ? null : Math.round(lluvia * diasMes * 100) / 100, temperatura_media_c: valor("T2M", clave), humedad_raices_pct: humedad === null ? null : humedad * 100 };
    });
    if (meses.every((m) => m.lluvia_mm !== null && m.temperatura_media_c !== null && m.humedad_raices_pct !== null)) historicoMensual = { periodo: { desde: "2002-01", hasta: "2025-12" }, tipo: "climatologia_mensual", fuente: { proveedor: "NASA_POWER" }, meses };
  }
  let pronosticoDiario = null;
  if (pronostico.status === "fulfilled" && pronostico.value.daily) {
    const d = pronostico.value.daily;
    if (Array.isArray(d.time) && d.time.length > 0 && [d.precipitation_sum, d.precipitation_probability_max, d.temperature_2m_min, d.temperature_2m_max].every((a) => Array.isArray(a) && a.length === d.time.length)) {
      pronosticoDiario = { fuente: { proveedor: "OPEN_METEO" }, generado_en: new Date().toISOString(), dias: d.time.map((fecha, i) => ({ fecha, lluvia_mm: d.precipitation_sum[i], probabilidad_lluvia_pct: d.precipitation_probability_max[i], temperatura_minima_c: d.temperature_2m_min[i], temperatura_maxima_c: d.temperature_2m_max[i] })) };
    }
  }
  const avisos = [];
  if (!historicoMensual) avisos.push({ codigo: "HISTORICO_NO_DISPONIBLE", mensaje: "No se pudo obtener la climatología histórica." });
  if (!pronosticoDiario) avisos.push({ codigo: "PRONOSTICO_NO_DISPONIBLE", mensaje: "No se pudo obtener el pronóstico." });
  return { version_api: "1", punto: { latitud, longitud }, historico_mensual: historicoMensual, pronostico_diario: pronosticoDiario, avisos };
}
